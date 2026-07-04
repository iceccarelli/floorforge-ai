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
  "Show refinishing pricing",
  "Grit sequencing explained",
  "Dust containment on site",
  "Commercial vs residential jobs",
  "ROI for 12,000 sqft office refinish",
  "How does it integrate with DryForge?",
];

const demoResponses: Record<string, string> = {
  "pricing": "Our Professional tier starts at $799/mo base + $99 per robot/month. Essentials at $299 base. Enterprise is custom. All include full InteriorFinish OS access, HEPA dust systems, and quality reporting. Bundle with DryForge + PaintForge for 25% savings on the full suite. Want me to walk you through a custom quote?",
  "grit": "Standard high-performance sequence for most North American hardwoods (oak, maple, ash): 36/40 grit aggressive stock removal → 60 grit → 80 grit → 120 grit → 150/180 grit final. FloorForge robots use real-time load sensing and species detection to auto-optimize pressure, feed rate, and pass overlap. Walnut and exotics often start at 60 grit to protect color. We log every pass for your quality report.",
  "dust": "Our integrated HEPA-14 + cyclonic pre-separation system captures 99.97% of dust at source. On-site airborne readings average <15 µg/m³ even during aggressive 36-grit passes — well below OSHA and LEED limits. Negative air machines optional for sensitive environments. Post-job, we generate a full particulate report tied to the job record in InteriorFinish OS.",
  "commercial": "Commercial jobs (offices, retail, schools) typically use 2–6 robots depending on sqft and timeline. We prioritize edge-to-edge consistency and schedule around occupancy. Residential focuses on single-family with faster setup/teardown and noise considerations. Both use the exact same software intelligence and hardware — workflow templates differ. Our edge-sensing tech shines in commercial with complex baseboards and transitions.",
  "roi": "For a 12,000 sqft commercial office refinish: typical manual is ~140–160 labor hours. With FloorForge you’ll see ~58% time reduction (robots run parallel passes), 2–3 robots recommended, ~$9,800–12,400 labor savings per job at $75/hr blended rate, plus 19–24% margin lift from fewer callbacks and faster turnover. Many crews book 3–4 months out once they adopt. Shall I open the full ROI calculator for your numbers?",
  "integrate": "FloorForge shares the exact same InteriorFinish OS layer as DryForge (walls) and PaintForge (ceilings). One job = one digital twin of the entire interior. Plan walls → ceilings → floors in sequence or parallel. Unified fleet dashboard, quality scoring across trades, and single source of truth for GCs and property managers. Cross-sell rate on existing DryForge/PaintForge customers is >70%.",
  default: "Thanks for your question. FloorForge delivers unmatched consistency on every hardwood species and job type. Our robots handle multi-grit sanding, precision edging, and flawless finish application (T-bar or robotic spray) while containing dust to near-zero. Everything syncs to InteriorFinish OS for planning, live monitoring, and post-job analytics. What specific part of the workflow can I help clarify — or would you like pricing for your typical job size?"
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "assistant",
      content: "Hi, I'm the FloorForge Assistant. I specialize in autonomous hardwood refinishing workflows, grit sequencing, dust containment, commercial vs residential economics, and integration with the rest of the InteriorFinish OS suite. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const addMessage = (type: "user" | "assistant", content: string) => {
    const newMessage: Message = { id: Date.now(), type, content };
    setMessages((prev) => [...prev, newMessage]);
  };

  const getResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes("price") || q.includes("pricing") || q.includes("cost") || q.includes("tier")) return demoResponses.pricing;
    if (q.includes("grit") || q.includes("sequence") || q.includes("sand")) return demoResponses.grit;
    if (q.includes("dust") || q.includes("hepa") || q.includes("containment")) return demoResponses.dust;
    if (q.includes("commercial") || q.includes("residential") || q.includes("job type")) return demoResponses.commercial;
    if (q.includes("roi") || q.includes("12,000") || q.includes("12000") || q.includes("office")) return demoResponses.roi;
    if (q.includes("integrate") || q.includes("dryforge") || q.includes("paintforge") || q.includes("suite")) return demoResponses.integrate;
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
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl hover:bg-[#1e293b] transition-all active:scale-95"
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
            className="fixed bottom-24 right-6 z-[60] w-full max-w-[380px] h-[520px] chatbot-panel rounded-3xl bg-white flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-base tracking-tight">FloorForge Assistant</div>
                  <div className="text-xs text-success flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Online • Specialized in hardwood
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
