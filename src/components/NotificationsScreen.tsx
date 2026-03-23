"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, MapPin, MessageCircle, Star, Flame, Bell, Shield, UserCheck } from "lucide-react";
import { useStore } from "@/store";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationType } from "@/types";

const ICON_MAP: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  activity_joined: { icon: UserPlus, color: "#6C5CE7", bg: "#6C5CE712" },
  new_activity: { icon: MapPin, color: "#00B894", bg: "#00B89412" },
  chat_message: { icon: MessageCircle, color: "#0984E3", bg: "#0984E312" },
  rating: { icon: Star, color: "#FDCB6E", bg: "#FDCB6E20" },
  hotspot: { icon: Flame, color: "#FF4757", bg: "#FF475712" },
  profile_request: { icon: UserCheck, color: "#6C5CE7", bg: "#6C5CE712" },
  system: { icon: Shield, color: "#636E72", bg: "#636E7212" },
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
  }, [user, setUnreadCount]);

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
    // Single batch request instead of N individual requests
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
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <button onClick={() => setScreen("map")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h3 className="flex-1 font-bold text-lg">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-violet-600 text-xs font-semibold">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-gray-300 mt-1">You&apos;re all caught up</p>
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {notifications.map((notif, idx) => {
              const config = ICON_MAP[notif.type] || ICON_MAP.new_activity;
              const IconComp = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => !notif.read && markRead(notif.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
                    notif.read ? "opacity-50" : "bg-white hover:shadow-sm"
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{notif.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1.5 font-medium">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-600 mt-1.5 shrink-0" />
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
