"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, User } from "lucide-react";
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
  partner: { id: string; name: string; online: boolean };
  lastMessage: { text: string; sender: { name: string }; createdAt: string } | null;
  unread: number;
}

export default function ChatList() {
  const { user, setScreen, setCurrentChatId, setSelectedActivity, activities } = useStore();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [dms, setDms] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch(() => setLoading(false));
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="font-bold text-lg mb-3">Chats</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("groups")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === "groups" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            Group Chats
          </button>
          <button
            onClick={() => setTab("direct")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === "direct" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            Direct Messages
            {dms.some((d) => d.unread > 0) && (
              <span className="ml-1.5 w-2 h-2 bg-red-500 rounded-full inline-block" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10 text-sm">Loading chats...</div>
        ) : tab === "groups" ? (
          chats.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm">No group chats yet. Join an activity to start chatting!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.activityId}
                  onClick={() => openGroupChat(chat)}
                  className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer hover:bg-violet-50 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shrink-0"
                    style={{ background: TYPE_COLORS[chat.type] || "#6C5CE7" }}
                  >
                    {ACTIVITY_TYPES.find((t) => t.value === chat.type)?.icon || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{chat.title}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMessage
                        ? `${chat.lastMessage.sender.name}: ${chat.lastMessage.text}`
                        : "No messages yet"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {chat.lastMessage && (
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{chat.participantCount} members</div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          dms.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <User size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm">No direct messages yet. Say hi to someone on the map!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {dms.map((dm) => (
                <div
                  key={dm.partner.id}
                  onClick={() => openDm(dm)}
                  className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer hover:bg-violet-50 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                    {dm.partner.name.charAt(0)}
                    {dm.partner.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{dm.partner.name}</h4>
                    <p className="text-xs text-gray-500 truncate">
                      {dm.lastMessage
                        ? dm.lastMessage.text
                        : "No messages"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {dm.lastMessage && (
                      <span className="text-[10px] text-gray-400">
                        {formatRelativeTime(dm.lastMessage.createdAt)}
                      </span>
                    )}
                    {dm.unread > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-full mt-1">
                        {dm.unread}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
