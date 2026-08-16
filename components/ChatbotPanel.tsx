"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BLENDED_LABOR_RATE_USD,
  COMPLETE_FLOOR_SQFT_PER_DAY_LABEL,
  GRIT_SEQUENCE,
  HARDWARE_UNIT_COST_HIGH_USD,
  HARDWARE_UNIT_COST_LABEL,
  HARDWARE_UNIT_COST_LOW_USD,
  JOB_TYPE_ADJUSTMENT_PP,
  LABOR_TIME_REDUCTION_PCT,
  MACHINES_PER_COMPLETE_FLOOR,
  RAAS_MONTHLY_HIGH_USD,
  RAAS_MONTHLY_LABEL,
  RAAS_MONTHLY_LOW_USD,
  RAAS_TERM_MONTHS,
  SOFTWARE_TIERS,
} from "@/lib/product";
import { getRobot } from "@/lib/robots";

interface Message {
  id: number;
  type: "user" | "assistant";
  content: string;
}

const quickReplies = [
  "What is FloorForge?",
  "Grit sequencing explained",
  "How does dust reporting work?",
  "What's the planned pricing?",
  "How does the ROI model work?",
  "How do I join the pilot?",
];

/**
 * Scripted demo responses.
 *
 * EVERY FIGURE BELOW IS INTERPOLATED FROM lib/product.ts. None is typed.
 *
 * The previous version carried this warning above the pricing answer: "Kept in
 * step with the pricing section by hand — this string is the one place on the
 * site that restates it in prose, so a change there that misses here turns the
 * assistant into a second, stale price list."
 *
 * That is exactly what happened. FLOORFORGE_31 retired the field-only
 * throughput constant in favour of completeFloorSqftPerDay(), which counts the
 * perimeter the drum cannot reach, and every surface moved to the ~1,400–1,500
 * band — except this file, which went on answering "1,579 sqft/robot/day" to
 * anyone who asked about the ROI model. A figure roughly 5% high, appearing
 * nowhere else on the site, and high for precisely the reason the two-machine
 * argument exists: it ignored the perimeter.
 *
 * A hand-kept copy of a number is a stale number with a delay on it. So the
 * assistant now reads the same constants the pricing table and the ROI model
 * read, and cannot answer with a figure the site does not publish.
 *
 * Prose that has no job size in hand quotes the BAND, never a point from it:
 * throughput moves with room size because a perimeter grows with the square
 * root of the area while the field grows with the area.
 *
 * This assistant is explicitly labelled a demo and makes no claim about
 * deployed hardware or existing customers.
 */
const TIER = SOFTWARE_TIERS;
const FLEET_MONTHLY = `$${(RAAS_MONTHLY_LOW_USD * MACHINES_PER_COMPLETE_FLOOR).toLocaleString()}\u2013${(
  RAAS_MONTHLY_HIGH_USD * MACHINES_PER_COMPLETE_FLOOR
).toLocaleString()}`;
const FLEET_CAPITAL = `$${
  (HARDWARE_UNIT_COST_LOW_USD * MACHINES_PER_COMPLETE_FLOOR) / 1000
}\u2013${(HARDWARE_UNIT_COST_HIGH_USD * MACHINES_PER_COMPLETE_FLOOR) / 1000}K`;

const demoResponses: Record<string, string> = {
  what: "FloorForge is an early-stage operating system for autonomous hardwood floor refinishing: job planning from a site scan, multi-grit sanding orchestration, edging assistance, finish application monitoring, and per-job dust and quality reporting. The hardware and software are in development \u2014 the pilot program is how refinishing crews get involved now.",
  pricing:
    `Planned pricing (subject to change at launch): ${TIER.essentials.name} at $${TIER.essentials.baseUsd}/mo base + $${TIER.essentials.perRobotUsd} per robot, ` +
    `${TIER.professional.name} at $${TIER.professional.baseUsd}/mo base + $${TIER.professional.perRobotUsd} per robot, and custom Enterprise terms. ` +
    `Those are software subscriptions. For the machines there are two planned routes: robots-as-a-service at an indicative ` +
    `${RAAS_MONTHLY_LABEL} per robot per month, all-in over a ${RAAS_TERM_MONTHS}-month term, or buying outright at an indicative ` +
    `${HARDWARE_UNIT_COST_LABEL} per unit. Note a finished floor takes ${MACHINES_PER_COMPLETE_FLOOR} machines \u2014 a ${getRobot("sand").name} for the field and a ` +
    `${getRobot("edge").name} for the band at the wall a drum cannot reach \u2014 so a complete setup is roughly ${FLEET_MONTHLY}/mo on the service route or ` +
    `${FLEET_CAPITAL} of capital on the purchase route. ${TIER.essentials.name} covers the field only; the perimeter is edged manually or by an ` +
    `${getRobot("edge").codename} on ${TIER.professional.name}. None of this is locked or an offer \u2014 no machine has been built and no manufacturer has quoted a unit cost. ` +
    `Pilot participants get a loaner unit at no hardware cost and preferential launch pricing. Want to join the waitlist?`,
  grit:
    `FloorForge plans and logs a ${GRIT_SEQUENCE.join("\u2192")} sequence \u2014 ${GRIT_SEQUENCE[0]} to strip the old finish, ${GRIT_SEQUENCE[1]} to level, ` +
    `${GRIT_SEQUENCE[GRIT_SEQUENCE.length - 1]} to finish sand. That is the sequence the firmware reads and the post-job report writes back. Hand crews often run more steps ` +
    `(60, 150, 180) and walnut or exotics often start at 60 grit to protect color; species-adaptive sequences are a design goal, not something the first pilot units will do. ` +
    `FloorForge is designed to auto-select and log the sequence per job using load sensing and species detection.`,
  dust: "The design pairs HEPA filtration with cyclonic pre-separation and logs airborne particulate readings throughout the job, so dust performance is documented in the job record rather than promised verbally. Final specs will be validated during the pilot program.",
  roi:
    `The ROI model on this page is fully transparent: it takes your square footage, current manual hours, and job type, then applies a ` +
    `${LABOR_TIME_REDUCTION_PCT}% labor time-reduction baseline (reduced by ${Math.abs(JOB_TYPE_ADJUSTMENT_PP.commercial)} points for commercial complexity), a ` +
    `$${BLENDED_LABOR_RATE_USD}/hr blended labor rate, and a throughput target of ${COMPLETE_FLOOR_SQFT_PER_DAY_LABEL} sqft of FINISHED floor per robot-day \u2014 ` +
    `field and perimeter, across a ${GRIT_SEQUENCE.join("\u2192")} sequence. It is a band rather than one number because a perimeter grows with the square root of the area ` +
    `while the field grows with the area, so the figure moves with room size. Those are design assumptions, not measured field results \u2014 validating them is a core goal of the pilot.`,
  pilot: "Scroll to the waitlist section and drop your details, or use the button in the header. We're recruiting a small group of residential, commercial, and specialty refinishing operations to define requirements and test early workflows, in exchange for preferential launch terms.",
  default: "I'm a scripted demo assistant for FloorForge, an early-stage autonomous floor refinishing platform. I can explain the concept, the planned workflow, grit sequencing, the transparent ROI model, planned pricing, or how to join the pilot program. What would you like to know?",
};
export default function ChatbotPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "assistant",
      content: "Hi — I'm a scripted demo assistant for FloorForge, an early-stage product in active development. I can explain what we're building, grit sequencing, dust reporting, the ROI model, planned pricing, and how to join the pilot program.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const nextId = useRef(2);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const addMessage = (type: "user" | "assistant", content: string) => {
    const newMessage: Message = { id: nextId.current++, type, content };
    setMessages((prev) => [...prev, newMessage]);
  };

  const getResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("price") || q.includes("pricing") || q.includes("cost") || q.includes("tier")) return demoResponses.pricing;
    if (q.includes("grit") || q.includes("sequence") || q.includes("sand")) return demoResponses.grit;
    if (q.includes("dust") || q.includes("hepa") || q.includes("containment") || q.includes("report")) return demoResponses.dust;
    if (q.includes("roi") || q.includes("model") || q.includes("calculat") || q.includes("economic")) return demoResponses.roi;
    if (q.includes("pilot") || q.includes("waitlist") || q.includes("join") || q.includes("sign up")) return demoResponses.pilot;
    if (q.includes("what is") || q.includes("about") || q.includes("floorforge")) return demoResponses.what;
    return demoResponses.default;
  };

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || inputValue.trim();
    if (!messageText) return;

    addMessage("user", messageText);
    setInputValue("");
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 450));
    const response = getResponse(messageText);
    addMessage("assistant", response);
    setIsTyping(false);
  };

  const handleQuickReply = (reply: string) => handleSend(reply);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-[380px] h-[min(520px,calc(100dvh-8rem))] chatbot-panel rounded-3xl bg-white flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-base tracking-tight">FloorForge Assistant</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" /> Scripted demo — not a live agent
                  </div>
                </div>
              </div>
              {/* Both buttons in this panel were icon-only, so a screen reader announced
                  them as "button" and "button" (axe: button-name, critical). The route
                  scan never caught it because it does not open the assistant — this is
                  the second time a defect has hidden behind a closed panel, after the
                  telemetry log in FLOORFORGE_26. Also below the 44px target floor at
                  p-1; min-h-11/min-w-11 fixes both at once. */}
              <button
                type="button"
                onClick={() => onClose()}
                aria-label="Close the assistant panel"
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Focusable and labelled: a scrollable region that keyboard users cannot
                reach is axe's scrollable-region-focusable, and it is the whole
                conversation. role="log" is what a screen reader needs to announce
                new replies as they arrive rather than only on focus. */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8fafc] text-sm"
              tabIndex={0}
              role="log"
              aria-live="polite"
              aria-label="Conversation with the FloorForge Assistant"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`message-bubble flex items-start gap-2.5 ${msg.type === "user" ? "message-user" : "message-assistant"}`}>
                    {msg.type === "assistant" && <div className="mt-0.5 flex-shrink-0"><Bot size={16} className="text-accent" /></div>}
                    <div>{msg.content}</div>
                    {msg.type === "user" && <div className="mt-0.5 flex-shrink-0"><User size={16} /></div>}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="message-bubble message-assistant flex items-center gap-2">
                    <Bot size={16} className="text-accent" />
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length < 4 && (
              <div className="px-4 pt-3 pb-2 bg-white border-t flex flex-wrap gap-2">
                {quickReplies.slice(0, 4).map((reply, idx) => (
                  <button key={idx} onClick={() => handleQuickReply(reply)} className="quick-reply text-xs hover:bg-accent-light hover:border-accent hover:text-accent-hover">{reply}</button>
                ))}
              </div>
            )}

            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about sanding, pricing, integration..." className="input flex-1 text-sm h-11" disabled={isTyping} />
                <Button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  variant="accent"
                  size="icon"
                  aria-label="Send message"
                  className="h-11 w-11 flex-shrink-0"
                >
                  <Send size={17} aria-hidden="true" />
                </Button>
              </div>
              <div className="text-[10px] text-center text-muted-foreground mt-2">Demo mode • Powered by FloorForge intelligence</div>
            </div>
          </motion.div>
        )}
    </AnimatePresence>
  );
}
