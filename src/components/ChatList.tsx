"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, User, WifiOff } from "lucide-react";
import { useStore } from "@/store";
import { TYPE_COLORS, ACTIVITY_TYPES, formatRelativeTime } from "@/lib/utils";

interface ChatItem {
  activityId: string;
  title: string;
  type: string;
  lastMessage: { text: string; sender: { name: string }; createdAt: string } | null;
  participantCount: number;
  messageCount: number;
}

interface DmConversation {
  partner: { id: string; name: string; online: boolean; avatar?: string };
  lastMessage: { text: string; sender: { name: string }; createdAt: string } | null;
  unread: number;
}

export default function ChatList() {
  const { user, setScreen, setCurrentChatId, setSelectedActivity, activities } = useStore();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [dms, setDms] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"groups" | "direct">("groups");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/chat?userId=${user.id}`).then((r) => r.json()),
      fetch(`/api/dm?userId=${user.id}`).then((r) => r.json()),
    ])
      .then(([chatData, dmData]) => {
        setChats(chatData);
        setDms(dmData);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError(true); });
  }, [user]);

  const openGroupChat = (chat: ChatItem) => {
    setCurrentChatId(chat.activityId);
    const activity = activities.find((a) => a.id === chat.activityId);
    if (activity) setSelectedActivity(activity);
    setScreen("chat");
  };

  const openDm = (dm: DmConversation) => {
    setCurrentChatId(`dm:${dm.partner.id}`);
    setScreen("chat");
  };

  const dmUnreadTotal = dms.reduce((s, d) => s + d.unread, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-[#f8f8fa] flex flex-col"
    >
      {/* ── Header ── */}
      <div className="bg-[#1a1a2e] px-5 pt-5 pb-4">
        <h3 className="font-extrabold text-[22px] text-white tracking-tight mb-4">Messages</h3>
        <div className="relative flex bg-white/[0.07] p-1 rounded-xl">
          <motion.div
            layoutId="chat-tab-indicator"
            className="absolute top-1 bottom-1 rounded-lg bg-[#6c5ce7] shadow-[0_0_12px_rgba(108,92,231,0.3)]"
            style={{ width: "calc(50% - 4px)", left: tab === "groups" ? 4 : "calc(50% + 0px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setTab("groups")}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors relative z-10 ${
              tab === "groups" ? "text-white" : "text-white/40"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setTab("direct")}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors relative z-10 ${
              tab === "direct" ? "text-white" : "text-white/40"
            }`}
          >
            Direct
            {dmUnreadTotal > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#ff6b6b] text-white text-[10px] font-bold rounded-full"
              >
                {dmUnreadTotal}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="w-14 h-14 bg-[#ffe8e8] rounded-2xl flex items-center justify-center mb-4">
                <WifiOff size={26} className="text-[#ff6b6b]" />
              </div>
              <p className="text-[14px] font-semibold text-[#1a1a2e]">Failed to load chats</p>
              <p className="text-[12px] text-[#9e9eb0] mt-1">Check your connection and try again</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-5 py-2.5 bg-[#6c5ce7] text-white text-[13px] rounded-xl font-semibold shadow-[0_4px_12px_rgba(108,92,231,0.3)]">Retry</button>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="w-7 h-7 border-2 border-[#e8e8ef] border-t-[#6c5ce7] rounded-full animate-spin" />
            </motion.div>
          ) : tab === "groups" ? (
            chats.length === 0 ? (
              <motion.div
                key="empty-groups"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-14 h-14 bg-[#e8e5ff] rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle size={26} className="text-[#a29bfe]" />
                </div>
                <p className="text-[14px] font-semibold text-[#1a1a2e]">No group chats yet</p>
                <p className="text-[12px] text-[#9e9eb0] mt-1">Join an activity to start chatting</p>
              </motion.div>
            ) : (
              <motion.div
                key="group-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-0.5"
              >
                {chats.map((chat, idx) => {
                  const chatColor = TYPE_COLORS[chat.type] || "#6c5ce7";
                  return (
                    <motion.div
                      key={chat.activityId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => openGroupChat(chat)}
                      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:shadow-sm active:scale-[0.98] transition-all bg-white border border-black/[0.04]"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                        style={{ background: `${chatColor}15` }}
                      >
                        {ACTIVITY_TYPES.find((t) => t.value === chat.type)?.icon || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-[13px] text-[#1a1a2e] truncate pr-2">{chat.title}</h4>
                          {chat.lastMessage && (
                            <span className="text-[9px] text-[#9e9eb0] shrink-0 font-medium">{formatRelativeTime(chat.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9e9eb0] truncate mt-0.5">
                          {chat.lastMessage
                            ? `${chat.lastMessage.sender.name}: ${chat.lastMessage.text}`
                            : "No messages yet"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0" style={{ background: `${chatColor}10` }}>
                        <span className="text-[9px] font-bold" style={{ color: chatColor }}>{chat.participantCount}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )
          ) : (
            dms.length === 0 ? (
              <motion.div
                key="empty-dms"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <div className="w-14 h-14 bg-[#e6f9f4] rounded-2xl flex items-center justify-center mb-4">
                  <User size={26} className="text-[#00b894]" />
                </div>
                <p className="text-[14px] font-semibold text-[#1a1a2e]">No direct messages</p>
                <p className="text-[12px] text-[#9e9eb0] mt-1">Say hi to someone on the map</p>
              </motion.div>
            ) : (
              <motion.div
                key="dm-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-0.5"
              >
                {dms.map((dm, idx) => (
                  <motion.div
                    key={dm.partner.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => openDm(dm)}
                    className={`flex items-center gap-3.5 p-3 rounded-xl cursor-pointer hover:bg-white active:bg-[#f4f4f8] transition-all relative overflow-hidden ${
                      dm.unread > 0 ? "bg-white border border-black/[0.03]" : ""
                    }`}
                  >
                    {dm.unread > 0 && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#6c5ce7]" />
                    )}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] text-white flex items-center justify-center text-sm font-bold overflow-hidden">
                        {dm.partner.avatar ? <img src={dm.partner.avatar} alt="" className="w-full h-full object-cover" /> : dm.partner.name.charAt(0)}
                      </div>
                      {dm.partner.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00b894] border-2 border-[#f8f8fa] rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-[14px] truncate ${dm.unread > 0 ? "font-bold text-[#1a1a2e]" : "font-semibold text-[#4a4a5e]"}`}>{dm.partner.name}</h4>
                        {dm.lastMessage && (
                          <span className={`text-[10px] shrink-0 font-medium ${dm.unread > 0 ? "text-[#6c5ce7]" : "text-[#d1d1db]"}`}>{formatRelativeTime(dm.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <p className={`text-[12px] truncate mt-0.5 ${dm.unread > 0 ? "text-[#4a4a5e] font-medium" : "text-[#9e9eb0]"}`}>
                        {dm.lastMessage ? dm.lastMessage.text : "No messages"}
                      </p>
                    </div>
                    {dm.unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="min-w-[22px] h-[22px] px-1.5 bg-[#6c5ce7] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0"
                      >
                        {dm.unread}
                      </motion.span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
