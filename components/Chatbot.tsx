"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
import { CHATBOT_TRIGGER_ATTR } from "@/lib/chatbot";

/**
 * The assistant launcher, and only the launcher.
 *
 * Everything behind it — `framer-motion`, the message list, the scripted
 * response table — now lives in ChatbotPanel.tsx and loads on first open.
 * Nothing a visitor has not asked for is downloaded, and the homepage's first
 * load stops paying for a panel most visitors never open
 * (audit/PERFORMANCE.md §3).
 *
 * The launcher itself is a plain button with no animation library behind it,
 * and it is ALWAYS mounted. That matters more than the bytes: `openChatbot()`
 * finds it by CHATBOT_TRIGGER_ATTR, and the "Ask the demo assistant" CTA on the
 * homepage calls it. If the launcher were lazy too, that CTA would be dead
 * until some chunk happened to arrive — which mission Part II.2 forbids and
 * which nobody would notice in testing, because on a fast connection the chunk
 * is always there.
 *
 * `ssr: false` is correct here and is NOT the P0-2 failure mode: the panel
 * holds no content a crawler or a JS-disabled reader needs. It is a scripted
 * demo that cannot exist without JavaScript in the first place.
 */
const ChatbotPanel = dynamic(() => import("@/components/ChatbotPanel"), {
  ssr: false,
});

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  /**
   * Once opened, keep the panel mounted so its conversation survives a close
   * and re-open — and so the chunk is fetched exactly once.
   */
  const [everOpened, setEverOpened] = useState(false);

  const toggle = () => {
    setIsOpen((open) => {
      if (!open) setEverOpened(true);
      return !open;
    });
  };

  return (
    <>
      <button
        onClick={toggle}
        className={`chat-launcher ${isOpen ? "chat-open" : ""} chat-launcher-pos fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl hover:bg-accent-hover transition-all active:scale-95`}
        aria-label={isOpen ? "Close FloorForge Assistant" : "Open FloorForge Assistant"}
        aria-expanded={isOpen}
        {...{ [CHATBOT_TRIGGER_ATTR]: "" }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {everOpened && (
        <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
