"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCheck, Phone, MoreVertical } from "lucide-react";
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
  sender: { id: string; name: string; avatar?: string };
  receiver: { id: string; name: string; avatar?: string };
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

  const lastFetchRef = useRef<string>("");
  useEffect(() => {
    if (!currentChatId || !user) return;
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        if (isDm && dmPartnerId) {
          const since = dmMessages.length > 0 ? dmMessages[dmMessages.length - 1].createdAt : "";
          const url = `/api/dm?userId=${user.id}&otherId=${dmPartnerId}${since ? `&since=${since}` : ""}`;
          if (url === lastFetchRef.current) return;
          lastFetchRef.current = url;
          const res = await fetch(url);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDmMessages((prev) => {
              const ids = new Set(prev.map(m => m.id));
              const newMsgs = data.filter((m: DmMessage) => !ids.has(m.id));
              return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
            });
          }
          lastFetchRef.current = "";
        } else {
          const msgs = chatMessages[currentChatId!] || [];
          const since = msgs.length > 0 ? msgs[msgs.length - 1].createdAt : "";
          const url = `/api/activities/${currentChatId}/messages${since ? `?since=${since}` : ""}`;
          if (url === lastFetchRef.current) return;
          lastFetchRef.current = url;
          const res = await fetch(url);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const ids = new Set(msgs.map(m => m.id));
            const newMsgs = data.filter((m: MessageType) => !ids.has(m.id));
            if (newMsgs.length > 0) {
              setChatMessages(currentChatId!, [...msgs, ...newMsgs]);
            }
          }
          lastFetchRef.current = "";
        }
      } catch { lastFetchRef.current = ""; }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentChatId, user, isDm, dmPartnerId, setChatMessages, dmMessages, chatMessages]);

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
    ? (dmMessages.length > 0
        ? (dmMessages[0].senderId === user?.id ? dmMessages[0].receiver?.name : dmMessages[0].sender?.name) || "Direct Message"
        : "Direct Message")
    : selectedActivity?.title || "Chat";

  const chatSubtitle = isDm
    ? "Direct message"
    : `${selectedActivity?.participants?.length || 0} members`;

  const partnerAvatar = isDm && dmMessages.length > 0
    ? (dmMessages[0].senderId === user?.id ? dmMessages[0].receiver?.avatar : dmMessages[0].sender?.avatar)
    : null;

  const allMessages = isDm ? dmMessages : groupMessages;

  // Group messages by date
  const groupedByDate: { date: string; messages: (MessageType | DmMessage)[] }[] = [];
  let lastDate = "";
  allMessages.forEach((msg) => {
    const d = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    if (d !== lastDate) {
      groupedByDate.push({ date: d, messages: [] });
      lastDate = d;
    }
    groupedByDate[groupedByDate.length - 1].messages.push(msg);
  });

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <button onClick={() => setScreen("chat-list")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
          {partnerAvatar ? <img src={partnerAvatar} alt="" className="w-full h-full object-cover" /> : chatTitle.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">{chatTitle}</h3>
          <p className="text-xs text-gray-400">{chatSubtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 border-3 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-violet-50 rounded-3xl flex items-center justify-center">
                <Send size={24} className="text-violet-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">No messages yet</p>
              <p className="text-gray-300 text-xs mt-1">Say something to start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedByDate.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-semibold rounded-full">{group.date}</span>
                </div>
                {group.messages.map((msg: MessageType | DmMessage, idx) => {
                  const isSelf = msg.senderId === user?.id;
                  const seen = "seen" in msg ? msg.seen : false;
                  const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                  const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-0.5" : "mt-2.5"}`}
                    >
                      <div className={`max-w-[78%] ${isSelf ? "order-1" : "order-1"}`}>
                        {!isSelf && !isDm && !isConsecutive && (
                          <p className="text-[11px] font-semibold mb-1 ml-1 text-violet-500">
                            {msg.sender?.name}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2.5 text-[14px] leading-relaxed ${
                            isSelf
                              ? `bg-violet-600 text-white ${isConsecutive ? "rounded-2xl rounded-tr-lg" : "rounded-2xl rounded-br-lg"}`
                              : `bg-white text-gray-800 shadow-sm border border-gray-100 ${isConsecutive ? "rounded-2xl rounded-tl-lg" : "rounded-2xl rounded-bl-lg"}`
                          }`}
                        >
                          {msg.text}
                          <div className={`flex items-center gap-1 mt-1 ${isSelf ? "justify-end" : "justify-end"}`}>
                            <span className={`text-[10px] ${isSelf ? "text-white/50" : "text-gray-300"}`}>
                              {formatTime(msg.createdAt)}
                            </span>
                            {isSelf && (
                              <CheckCheck size={12} className={seen ? "text-sky-300" : "text-white/30"} />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2.5 p-3 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage}
          disabled={!input.trim()}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            input.trim()
              ? "bg-violet-600 text-white shadow-md shadow-violet-200"
              : "bg-gray-100 text-gray-300"
          }`}
        >
          <Send size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}
