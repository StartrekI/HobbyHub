"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";
import { useStore } from "@/store";
import { formatTime } from "@/lib/utils";
import type { MessageType } from "@/types";

interface DmMessage {
  id: string;
  text: string;
  createdAt: string;
  seen: boolean;
  senderId: string;
  receiverId: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
}

export default function ChatScreen() {
  const { user, currentChatId, selectedActivity, setScreen, chatMessages, setChatMessages, addChatMessage } = useStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDm = currentChatId?.startsWith("dm:");
  const dmPartnerId = isDm ? currentChatId!.replace("dm:", "") : null;
  const groupMessages = chatMessages[currentChatId || ""] || [];

  // Fetch messages
  useEffect(() => {
    if (!currentChatId || !user) return;
    setLoading(true);

    if (isDm && dmPartnerId) {
      fetch(`/api/dm?userId=${user.id}&otherId=${dmPartnerId}`)
        .then((r) => r.json())
        .then((data) => { setDmMessages(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      fetch(`/api/activities/${currentChatId}/messages`)
        .then((r) => r.json())
        .then((data) => { setChatMessages(currentChatId!, data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [currentChatId, user, isDm, dmPartnerId, setChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages, dmMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!currentChatId || !user) return;
    const interval = setInterval(async () => {
      try {
        if (isDm && dmPartnerId) {
          const res = await fetch(`/api/dm?userId=${user.id}&otherId=${dmPartnerId}`);
          const data = await res.json();
          setDmMessages(data);
        } else {
          const res = await fetch(`/api/activities/${currentChatId}/messages`);
          const data = await res.json();
          setChatMessages(currentChatId!, data);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [currentChatId, user, isDm, dmPartnerId, setChatMessages]);

  const sendMessage = async () => {
    if (!input.trim() || !currentChatId || !user) return;
    const text = input.trim();
    setInput("");

    try {
      if (isDm && dmPartnerId) {
        const res = await fetch("/api/dm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: user.id, receiverId: dmPartnerId, text }),
        });
        const msg = await res.json();
        setDmMessages((prev) => [...prev, msg]);
      } else {
        const res = await fetch(`/api/activities/${currentChatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, senderId: user.id }),
        });
        const message = await res.json();
        addChatMessage(currentChatId!, message);
      }
    } catch (e) {
      console.error("Send error:", e);
    }
  };

  const chatTitle = isDm
    ? (dmMessages[0]?.senderId === user?.id ? dmMessages[0]?.receiver?.name : dmMessages[0]?.sender?.name) || "Direct Message"
    : selectedActivity?.title || "Chat";

  const chatSubtitle = isDm
    ? "Direct message"
    : `${selectedActivity?.participants?.length || 0} participants`;

  const allMessages = isDm ? dmMessages : groupMessages;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <button onClick={() => setScreen("chat-list")}><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h3 className="font-bold text-sm truncate">{chatTitle}</h3>
          <p className="text-xs text-gray-400">{chatSubtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">Loading messages...</p>
        ) : allMessages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No messages yet. Say something!</p>
        ) : (
          allMessages.map((msg: MessageType | DmMessage) => {
            const isSelf = msg.senderId === user?.id;
            const seen = "seen" in msg ? msg.seen : false;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[80%] ${isSelf ? "ml-auto" : "mr-auto"}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isSelf
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-white shadow-sm rounded-bl-sm"
                  }`}
                >
                  {!isSelf && !isDm && (
                    <p className="text-[11px] font-bold mb-0.5 text-violet-600">
                      {msg.sender?.name}
                    </p>
                  )}
                  {msg.text}
                  <div className={`flex items-center gap-1 mt-1 justify-end ${isSelf ? "text-white/60" : "text-gray-400"}`}>
                    <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                    {isSelf && (
                      <CheckCheck size={12} className={seen ? "text-blue-300" : "opacity-50"} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full text-sm outline-none focus:border-violet-600 bg-gray-50 transition-colors"
        />
        <button
          onClick={sendMessage}
          className="w-11 h-11 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </motion.div>
  );
}
