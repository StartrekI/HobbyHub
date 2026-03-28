"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, MapPin, MessageCircle, Star, Flame, Bell, Shield, UserCheck } from "lucide-react";
import { useStore } from "@/store";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationType } from "@/types";

const ICON_MAP: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  activity_joined: { icon: UserPlus, color: "#6c5ce7", bg: "#e8e5ff" },
  new_activity: { icon: MapPin, color: "#00b894", bg: "#e6f9f4" },
  chat_message: { icon: MessageCircle, color: "#74b9ff", bg: "#e8f4ff" },
  rating: { icon: Star, color: "#fdcb6e", bg: "#fef9e7" },
  hotspot: { icon: Flame, color: "#ff6b6b", bg: "#ffe8e8" },
  profile_request: { icon: UserCheck, color: "#6c5ce7", bg: "#e8e5ff" },
  system: { icon: Shield, color: "#6e6e82", bg: "#f4f4f8" },
};

export default function NotificationsScreen() {
  const { user, setScreen, setUnreadCount } = useStore();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notifications?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n: NotificationType) => !n.read).length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      setUnreadCount(updated.filter((n) => !n.read).length);
      return updated;
    });
  };

  const markAllRead = async () => {
    if (!user) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true, userId: user.id }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[68px] bg-[#f8f8fa] z-[900] flex flex-col"
    >
      {/* ── Header ── */}
      <div className="header-glass flex items-center gap-3 px-5 py-3.5">
        <button onClick={() => setScreen("map")} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f8] hover:bg-[#e8e8ef] transition-colors">
          <ArrowLeft size={16} className="text-[#4a4a5e]" />
        </button>
        <h3 className="flex-1 font-bold text-lg text-[#1a1a2e]">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-[#6c5ce7] text-[12px] font-semibold hover:text-[#5a4bd1] transition-colors">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-7 h-7 border-2 border-[#e8e8ef] border-t-[#6c5ce7] rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 bg-[#f4f4f8] rounded-2xl flex items-center justify-center mb-4">
              <Bell size={26} className="text-[#d1d1db]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1a1a2e]">No notifications yet</p>
            <p className="text-[12px] text-[#9e9eb0] mt-1">You&apos;re all caught up</p>
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {notifications.map((notif, idx) => {
              const config = ICON_MAP[notif.type] || ICON_MAP.new_activity;
              const IconComp = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => !notif.read && markRead(notif.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
                    notif.read ? "opacity-45" : "bg-white border border-black/[0.03] hover:shadow-sm"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <IconComp size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1a1a2e] leading-tight">{notif.title}</p>
                    <p className="text-[12px] text-[#6e6e82] mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-[#d1d1db] mt-1.5 font-medium">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#6c5ce7] mt-1.5 shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
