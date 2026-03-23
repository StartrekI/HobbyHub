"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <h3 className="font-bold text-xl mb-3">Messages</h3>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setTab("groups")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "groups" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setTab("direct")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all relative ${
              tab === "direct" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"
            }`}
          >
            Direct
            {dmUnreadTotal > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {dmUnreadTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <WifiOff size={40} className="mb-4 opacity-40" />
            <p className="text-sm font-medium">Failed to load chats</p>
            <button onClick={() => window.location.reload()} className="mt-3 px-5 py-2 bg-violet-600 text-white text-sm rounded-xl font-semibold">Retry</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : tab === "groups" ? (
          chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mb-4">
                <MessageCircle size={28} className="text-violet-300" />
              </div>
              <p className="text-sm font-medium">No group chats yet</p>
              <p className="text-xs text-gray-300 mt-1">Join an activity to start chatting</p>
            </div>
          ) : (
            <div className="p-3 space-y-0.5">
              {chats.map((chat, idx) => (
                <motion.div
                  key={chat.activityId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => openGroupChat(chat)}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-white active:scale-[0.99] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${TYPE_COLORS[chat.type] || "#6C5CE7"}, ${TYPE_COLORS[chat.type] || "#6C5CE7"}dd)` }}
                  >
                    {ACTIVITY_TYPES.find((t) => t.value === chat.type)?.icon || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm truncate pr-2">{chat.title}</h4>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-gray-300 shrink-0">{formatRelativeTime(chat.lastMessage.createdAt)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {chat.lastMessage
                        ? `${chat.lastMessage.sender.name}: ${chat.lastMessage.text}`
                        : "No messages yet"}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{chat.participantCount} members</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          dms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4">
                <User size={28} className="text-emerald-300" />
              </div>
              <p className="text-sm font-medium">No direct messages</p>
              <p className="text-xs text-gray-300 mt-1">Say hi to someone on the map</p>
            </div>
          ) : (
            <div className="p-3 space-y-0.5">
              {dms.map((dm, idx) => (
                <motion.div
                  key={dm.partner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => openDm(dm)}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-white active:scale-[0.99] transition-all"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                      {dm.partner.avatar ? <img src={dm.partner.avatar} alt="" className="w-full h-full object-cover" /> : dm.partner.name.charAt(0)}
                    </div>
                    {dm.partner.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-50 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{dm.partner.name}</h4>
                      {dm.lastMessage && (
                        <span className="text-[10px] text-gray-300 shrink-0">{formatRelativeTime(dm.lastMessage.createdAt)}</span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${dm.unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      {dm.lastMessage ? dm.lastMessage.text : "No messages"}
                    </p>
                  </div>
                  {dm.unread > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {dm.unread}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
