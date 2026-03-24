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
      className="absolute inset-0 bottom-[72px] bg-gradient-to-b from-gray-50 to-gray-100/80 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white/90 backdrop-blur-2xl border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">Messages</h3>
        <div className="relative flex bg-gray-100/80 p-1 rounded-2xl">
          {/* Sliding indicator */}
          <motion.div
            layoutId="chat-tab-indicator"
            className="absolute top-1 bottom-1 rounded-xl bg-white shadow-md shadow-gray-200/60"
            style={{ width: "calc(50% - 4px)", left: tab === "groups" ? 4 : "calc(50% + 0px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setTab("groups")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors relative z-10 ${
              tab === "groups" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setTab("direct")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors relative z-10 ${
              tab === "direct" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Direct
            {dmUnreadTotal > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full shadow-sm shadow-red-200 animate-pulse"
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
              className="flex flex-col items-center justify-center h-full text-gray-400"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5 shadow-sm"
              >
                <WifiOff size={36} className="text-red-300" />
              </motion.div>
              <p className="text-sm font-semibold text-gray-500">Failed to load chats</p>
              <p className="text-xs text-gray-300 mt-1">Check your connection and try again</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm rounded-2xl font-semibold shadow-md shadow-violet-200 hover:shadow-lg transition-shadow">Retry</button>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="w-9 h-9 border-[3px] border-gray-200 border-t-violet-500 rounded-full animate-spin" />
            </motion.div>
          ) : tab === "groups" ? (
            chats.length === 0 ? (
              <motion.div
                key="empty-groups"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full text-gray-400"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-5 shadow-sm"
                >
                  <MessageCircle size={32} className="text-violet-400" />
                </motion.div>
                <p className="text-sm font-semibold text-gray-500">No group chats yet</p>
                <p className="text-xs text-gray-300 mt-1.5">Join an activity to start chatting</p>
              </motion.div>
            ) : (
              <motion.div
                key="group-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-1"
              >
                {chats.map((chat, idx) => (
                  <motion.div
                    key={chat.activityId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => openGroupChat(chat)}
                    className="flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer hover:bg-white/80 active:scale-[0.99] transition-all group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 shadow-md"
                      style={{ background: `linear-gradient(135deg, ${TYPE_COLORS[chat.type] || "#6C5CE7"}, ${TYPE_COLORS[chat.type] || "#6C5CE7"}99)` }}
                    >
                      {ACTIVITY_TYPES.find((t) => t.value === chat.type)?.icon || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[15px] text-gray-800 truncate pr-2">{chat.title}</h4>
                        {chat.lastMessage && (
                          <span className="text-[10px] text-gray-400 shrink-0 font-medium">{formatRelativeTime(chat.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-400 truncate mt-0.5">
                        {chat.lastMessage
                          ? `${chat.lastMessage.sender.name}: ${chat.lastMessage.text}`
                          : "No messages yet"}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1 font-medium">{chat.participantCount} members</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )
          ) : (
            dms.length === 0 ? (
              <motion.div
                key="empty-dms"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full text-gray-400"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl flex items-center justify-center mb-5 shadow-sm"
                >
                  <User size={32} className="text-emerald-400" />
                </motion.div>
                <p className="text-sm font-semibold text-gray-500">No direct messages</p>
                <p className="text-xs text-gray-300 mt-1.5">Say hi to someone on the map</p>
              </motion.div>
            ) : (
              <motion.div
                key="dm-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 space-y-1"
              >
                {dms.map((dm, idx) => (
                  <motion.div
                    key={dm.partner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => openDm(dm)}
                    className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer hover:bg-white/80 active:scale-[0.99] transition-all relative overflow-hidden ${
                      dm.unread > 0 ? "bg-white/60" : ""
                    }`}
                  >
                    {/* Unread accent bar */}
                    {dm.unread > 0 && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                    )}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-lg font-bold overflow-hidden shadow-md shadow-emerald-100">
                        {dm.partner.avatar ? <img src={dm.partner.avatar} alt="" className="w-full h-full object-cover" /> : dm.partner.name.charAt(0)}
                      </div>
                      {dm.partner.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-[2.5px] border-gray-50 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-[15px] truncate ${dm.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>{dm.partner.name}</h4>
                        {dm.lastMessage && (
                          <span className={`text-[10px] shrink-0 font-medium ${dm.unread > 0 ? "text-violet-500" : "text-gray-300"}`}>{formatRelativeTime(dm.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <p className={`text-[13px] truncate mt-0.5 ${dm.unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                        {dm.lastMessage ? dm.lastMessage.text : "No messages"}
                      </p>
                    </div>
                    {dm.unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="min-w-[24px] h-[24px] px-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-md shadow-violet-200 animate-pulse"
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
