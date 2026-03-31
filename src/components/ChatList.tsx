"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Briefcase,
  CalendarDays,
  CheckCheck,
  MapPin,
  MessageCircle,
  PenSquare,
  Search,
  User,
  Users,
  WifiOff,
} from "lucide-react";
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

const FILTER_PILLS = [
  { label: "All", icon: null },
  { label: "Events", icon: CalendarDays },
  { label: "Gigs", icon: Briefcase },
  { label: "Connections", icon: Users },
  { label: "Nearby", icon: MapPin },
] as const;

export default function ChatList() {
  const { user, setScreen, setCurrentChatId, setSelectedActivity, activities } = useStore();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [dms, setDms] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"groups" | "direct">("groups");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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
  const onlineDms = dms.filter((dm) => dm.partner.online);

  // Combined items list for unified view
  const allItems = tab === "groups" ? chats : [];
  const allDmItems = tab === "direct" ? dms : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-white flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-3">
        <div className="flex mb-4 justify-between items-center">
          <div>
            <p className="font-medium uppercase text-[#71717b] text-xs leading-4 tracking-wide">
              Inbox
            </p>
            <h1 className="font-bold text-zinc-950 text-2xl leading-8">
              Messages
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen("notifications")}
              className="relative rounded-full bg-zinc-100 flex justify-center items-center w-9 h-9"
            >
              <Bell className="size-4 text-[#71717b]" />
              <span className="rounded-full bg-[#8e51ff] absolute right-1.5 top-1.5 w-2 h-2" />
            </button>
            <button className="rounded-full bg-[#8e51ff] flex justify-center items-center w-9 h-9">
              <PenSquare className="size-4 text-violet-50" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="rounded-xl bg-zinc-100 flex px-3 py-2 items-center gap-2">
          <Search className="size-4 flex-shrink-0 text-[#71717b]" />
          <input
            className="bg-transparent outline-none text-zinc-950 text-sm leading-5 flex-1 placeholder:text-[#71717b]"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-2 px-4">
        <div
          className="overflow-x-auto flex pb-1 gap-2"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = activeFilter === pill.label;
            const PillIcon = pill.icon;
            return (
              <button
                key={pill.label}
                onClick={() => setActiveFilter(pill.label)}
                className={`flex-shrink-0 font-semibold rounded-full text-xs leading-4 flex px-3 py-1.5 items-center gap-1 transition-colors ${
                  isActive
                    ? "bg-[#8e51ff] text-violet-50"
                    : "bg-zinc-100 text-zinc-900 font-medium"
                }`}
              >
                {PillIcon && <PillIcon className="size-3" />}
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Now section - show online DM partners */}
      {onlineDms.length > 0 && (
        <div className="mb-4 px-4">
          <div className="flex mb-2 justify-between items-center">
            <p className="font-semibold uppercase text-[#71717b] text-xs leading-4 tracking-wide">
              Active Now
            </p>
            <span className="font-medium text-[#8e51ff] text-xs leading-4">
              {onlineDms.length} online
            </span>
          </div>
          <div
            className="overflow-x-auto flex pb-1 gap-3"
            style={{ scrollbarWidth: "none" }}
          >
            {onlineDms.map((dm) => (
              <motion.div
                key={dm.partner.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => openDm(dm)}
                className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="relative">
                  <div
                    className="rounded-full text-lg leading-7 flex justify-center items-center w-12 h-12 overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.606 0.25 292.717), oklch(0.5 0.22 260))",
                    }}
                  >
                    {dm.partner.avatar ? (
                      <img
                        src={dm.partner.avatar}
                        alt={dm.partner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {dm.partner.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-green-500 border-white border-2 border-solid absolute right-0 bottom-0 w-3 h-3" />
                </div>
                <p className="text-[#71717b] text-xs leading-4">
                  {dm.partner.name.split(" ")[0]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab toggle (groups / direct) */}
      <div className="px-4 mb-2">
        <div className="relative flex bg-zinc-100 p-1 rounded-xl">
          <motion.div
            layoutId="chat-tab-indicator"
            className="absolute top-1 bottom-1 rounded-lg bg-[#8e51ff] shadow-sm"
            style={{
              width: "calc(50% - 4px)",
              left: tab === "groups" ? 4 : "calc(50% + 0px)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setTab("groups")}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors relative z-10 ${
              tab === "groups" ? "text-white" : "text-zinc-500"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setTab("direct")}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors relative z-10 ${
              tab === "direct" ? "text-white" : "text-zinc-500"
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

      {/* Content area */}
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
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <WifiOff size={26} className="text-red-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-950">Failed to load chats</p>
              <p className="text-xs text-[#71717b] mt-1">Check your connection and try again</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-5 py-2.5 bg-[#8e51ff] text-white text-[13px] rounded-xl font-semibold shadow-sm"
              >
                Retry
              </button>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="w-7 h-7 border-2 border-zinc-200 border-t-[#8e51ff] rounded-full animate-spin" />
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
                <div className="w-14 h-14 bg-[#8e51ff]/10 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle size={26} className="text-[#8e51ff]" />
                </div>
                <p className="text-sm font-semibold text-zinc-950">No group chats yet</p>
                <p className="text-xs text-[#71717b] mt-1">Join an activity to start chatting</p>
              </motion.div>
            ) : (
              <motion.div
                key="group-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-0"
              >
                {chats.map((chat, idx) => {
                  const chatColor = TYPE_COLORS[chat.type] || "#8e51ff";
                  const activityType = ACTIVITY_TYPES.find((t) => t.value === chat.type);
                  return (
                    <motion.div
                      key={chat.activityId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => openGroupChat(chat)}
                      className="border-b border-zinc-200 flex px-4 py-2 items-center gap-3 cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="rounded-2xl w-12 h-12 overflow-hidden bg-zinc-100 text-xl leading-7 flex justify-center items-center">
                          {activityType?.icon || "?"}
                        </div>
                        <div
                          className="rounded-full flex absolute -right-1 -bottom-1 justify-center items-center w-5 h-5"
                          style={{ backgroundColor: chatColor }}
                        >
                          <Users className="size-2.5 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex mb-0.5 justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-zinc-950 text-sm leading-5">
                              {chat.title}
                            </p>
                          </div>
                          {chat.lastMessage && (
                            <span className="flex-shrink-0 text-[#71717b] text-xs leading-4">
                              {formatRelativeTime(chat.lastMessage.createdAt).replace(" ago", "")}
                            </span>
                          )}
                        </div>
                        <div className="flex mb-1 items-center gap-1">
                          <span
                            className="font-medium rounded-full text-xs leading-4 px-1.5 py-0.5"
                            style={{
                              backgroundColor: `${chatColor}15`,
                              color: chatColor,
                            }}
                          >
                            {activityType?.label || chat.type}
                          </span>
                          <span className="text-[#71717b] text-xs leading-4">
                            · {chat.participantCount} members
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="truncate text-[#71717b] text-xs leading-4">
                            {chat.lastMessage
                              ? `${chat.lastMessage.sender.name}: ${chat.lastMessage.text}`
                              : "No messages yet"}
                          </p>
                          {chat.messageCount > 0 && (
                            <CheckCheck className="size-3.5 flex-shrink-0 text-[#71717b]" />
                          )}
                        </div>
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
                <div className="w-14 h-14 bg-[#8e51ff]/10 rounded-2xl flex items-center justify-center mb-4">
                  <User size={26} className="text-[#8e51ff]" />
                </div>
                <p className="text-sm font-semibold text-zinc-950">No direct messages</p>
                <p className="text-xs text-[#71717b] mt-1">Say hi to someone on the map</p>
              </motion.div>
            ) : (
              <motion.div
                key="dm-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-0"
              >
                {dms.map((dm, idx) => (
                  <motion.div
                    key={dm.partner.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => openDm(dm)}
                    className="border-b border-zinc-200 flex px-4 py-2 items-center gap-3 cursor-pointer hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="rounded-full text-lg leading-7 flex justify-center items-center w-12 h-12 overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.606 0.25 292.717), oklch(0.5 0.22 260))",
                        }}
                      >
                        {dm.partner.avatar ? (
                          <img
                            src={dm.partner.avatar}
                            alt={dm.partner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {dm.partner.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      {dm.partner.online && (
                        <span className="rounded-full bg-green-500 border-white border-2 border-solid absolute right-0 bottom-0 w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex mb-0.5 justify-between items-center">
                        <p
                          className={`truncate text-sm leading-5 ${
                            dm.unread > 0
                              ? "font-bold text-zinc-950"
                              : "font-semibold text-zinc-950"
                          }`}
                        >
                          {dm.partner.name}
                        </p>
                        {dm.lastMessage && (
                          <span
                            className={`flex-shrink-0 text-xs leading-4 ${
                              dm.unread > 0 ? "text-[#8e51ff]" : "text-[#71717b]"
                            }`}
                          >
                            {formatRelativeTime(dm.lastMessage.createdAt).replace(" ago", "")}
                          </span>
                        )}
                      </div>
                      {dm.partner.online && (
                        <div className="flex mb-1 items-center gap-1">
                          <span className="font-medium rounded-full bg-[#8e51ff]/10 text-[#8e51ff] text-xs leading-4 px-1.5 py-0.5">
                            Connection
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <p
                          className={`truncate text-xs leading-4 ${
                            dm.unread > 0
                              ? "text-zinc-700 font-medium"
                              : "text-[#71717b]"
                          }`}
                        >
                          {dm.lastMessage ? dm.lastMessage.text : "No messages"}
                        </p>
                        {dm.unread > 0 ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="font-bold rounded-full bg-[#8e51ff] text-violet-50 text-xs leading-4 flex justify-center items-center w-5 h-5 flex-shrink-0"
                          >
                            {dm.unread}
                          </motion.span>
                        ) : dm.lastMessage ? (
                          <CheckCheck className="size-3.5 flex-shrink-0 text-[#71717b]" />
                        ) : null}
                      </div>
                    </div>
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
