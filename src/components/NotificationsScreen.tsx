"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, MapPin, MessageCircle, Star, Flame, Bell, Shield, UserCheck } from "lucide-react";
import { useStore } from "@/store";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationType } from "@/types";

const ICON_MAP: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  activity_joined: { icon: UserPlus, color: "#6C5CE7", bg: "#6C5CE720" },
  new_activity: { icon: MapPin, color: "#00B894", bg: "#00B89420" },
  chat_message: { icon: MessageCircle, color: "#0984E3", bg: "#0984E320" },
  rating: { icon: Star, color: "#FDCB6E", bg: "#FDCB6E30" },
  hotspot: { icon: Flame, color: "#FF4757", bg: "#FF475720" },
  profile_request: { icon: UserCheck, color: "#6C5CE7", bg: "#6C5CE720" },
  system: { icon: Shield, color: "#636E72", bg: "#636E7220" },
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

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <button onClick={() => setScreen("map")}><ArrowLeft size={20} /></button>
        <h3 className="flex-1 font-bold text-lg">Notifications</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = ICON_MAP[notif.type] || ICON_MAP.new_activity;
              const IconComp = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => !notif.read && markRead(notif.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-colors ${
                    notif.read ? "opacity-60" : "bg-violet-50/50"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{notif.title}</p>
                    <p className="text-sm text-gray-600">{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-violet-600 mt-2 shrink-0" />
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
