"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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

// Scripted demo responses. This assistant is explicitly labeled as a demo —
// it makes no claims about deployed hardware or existing customers.
const demoResponses: Record<string, string> = {
  what: "FloorForge is an early-stage operating system for autonomous hardwood floor refinishing: job planning from a site scan, multi-grit sanding orchestration, edging assistance, finish application monitoring, and per-job dust and quality reporting. The hardware and software are in development — the pilot program is how refinishing crews get involved now.",
  pricing: "Planned pricing (subject to change at launch): Essentials at $299/mo base + $149 per robot, Professional at $799/mo base + $99 per robot, and custom Enterprise terms. Pilot participants get preferential launch pricing. Want to join the waitlist?",
  grit: "A standard high-performance sequence for most North American hardwoods (oak, maple, ash) runs 36/40 grit for aggressive stock removal, then 60, 80, 120, and 150/180 for the final pass. Walnut and exotics often start at 60 grit to protect color. FloorForge is designed to auto-select and log the sequence per job using load sensing and species detection.",
  dust: "The design pairs HEPA filtration with cyclonic pre-separation and logs airborne particulate readings throughout the job, so dust performance is documented in the job record rather than promised verbally. Final specs will be validated during the pilot program.",
  roi: "The ROI model on this page is fully transparent: it takes your square footage, current manual hours, and job type, then applies a 62% baseline time-reduction target (adjusted by job type), a $78/hr blended labor rate, and a ~2,200 sqft/robot/day throughput target. Those are design assumptions, not measured field results — validating them is a core goal of the pilot.",
  pilot: "Scroll to the waitlist section and drop your details, or use the button in the header. We're recruiting a small group of residential, commercial, and specialty refinishing operations to define requirements and test early workflows, in exchange for preferential launch terms.",
  default: "I'm a scripted demo assistant for FloorForge, an early-stage autonomous floor refinishing platform. I can explain the concept, the planned workflow, grit sequencing, the transparent ROI model, planned pricing, or how to join the pilot program. What would you like to know?",
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`chat-launcher ${isOpen ? "chat-open" : ""} fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl hover:bg-accent-hover transition-all active:scale-95`}
        aria-label="Open FloorForge Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

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
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8fafc] text-sm">
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
                <Button onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping} variant="accent" size="icon" className="h-11 w-11 flex-shrink-0"><Send size={17} /></Button>
              </div>
              <div className="text-[10px] text-center text-muted-foreground mt-2">Demo mode • Powered by FloorForge intelligence</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
