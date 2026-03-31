"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Flame,
  MapPin,
  MessageCircle,
  Settings,
  Shield,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { useStore } from "@/store";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { NotificationType } from "@/types";

const ICON_MAP: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  activity_joined: { icon: Users, color: "#8e51ff", bg: "rgba(142, 81, 255, 0.15)" },
  new_activity: { icon: MapPin, color: "#16a34a", bg: "rgba(22, 163, 74, 0.1)" },
  chat_message: { icon: MessageCircle, color: "#8e51ff", bg: "rgba(142, 81, 255, 0.15)" },
  rating: { icon: Star, color: "#eab308", bg: "rgba(234, 179, 8, 0.15)" },
  hotspot: { icon: Flame, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  profile_request: { icon: UserCheck, color: "#8e51ff", bg: "rgba(142, 81, 255, 0.15)" },
  system: { icon: Shield, color: "#71717b", bg: "rgba(113, 113, 123, 0.1)" },
};

const BORDER_COLORS: Record<string, string> = {
  activity_joined: "#8e51ff",
  new_activity: "#16a34a",
  chat_message: "#8e51ff",
  rating: "#eab308",
  hotspot: "#ef4444",
  profile_request: "#8e51ff",
  system: "#71717b",
};

const FILTER_LABELS = ["All", "Activities", "Gigs", "Music", "Social"] as const;

export default function NotificationsScreen() {
  const { user, setScreen, setUnreadCount } = useStore();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

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

  // Split into new (unread) and earlier (read) groups
  const newNotifications = notifications.filter((n) => !n.read);
  const earlierNotifications = notifications.filter((n) => n.read);

  const renderNotificationCard = (notif: NotificationType, idx: number, isNew: boolean) => {
    const config = ICON_MAP[notif.type] || ICON_MAP.new_activity;
    const IconComp = config.icon;
    const borderColor = BORDER_COLORS[notif.type] || "#8e51ff";

    if (isNew) {
      // New (unread) notifications use Card with left colored border
      return (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.04 }}
        >
          <Card
            className="border-t-0 border-r-0 border-b-0 border-l-4 border-solid p-4 gap-4 cursor-pointer hover:shadow-md transition-shadow"
            style={{ borderLeftColor: borderColor }}
            onClick={() => markRead(notif.id)}
          >
            <CardContent className="p-0 gap-2">
              <div className="flex gap-4">
                {/* Icon with unread dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className="rounded-full flex justify-center items-center w-11 h-11"
                    style={{ backgroundColor: config.bg }}
                  >
                    <IconComp className="size-5" style={{ color: config.color }} />
                  </div>
                  <div
                    className="rounded-full border-white border-2 border-solid absolute -right-0.5 -top-0.5 w-3 h-3"
                    style={{ backgroundColor: borderColor }}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-950 text-sm leading-5">
                        {notif.title}
                      </p>
                      <p className="text-[#71717b] text-xs leading-4 mt-1">
                        {notif.body}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-[#71717b] text-xs leading-4">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Action buttons for certain types */}
                  {notif.type === "activity_joined" && (
                    <div className="flex mt-2 gap-2">
                      <Button size="sm" className="rounded-full text-xs leading-4 px-4 h-8">
                        Join
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-full text-xs leading-4 px-4 h-8">
                        Decline
                      </Button>
                    </div>
                  )}
                  {notif.type === "profile_request" && (
                    <div className="flex mt-2 gap-2">
                      <Button size="sm" className="rounded-full text-xs leading-4 px-4 h-8">
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-full text-xs leading-4 px-4 h-8">
                        Decline
                      </Button>
                    </div>
                  )}
                  {notif.type === "chat_message" && (
                    <div className="flex mt-2 gap-2">
                      <Button size="sm" variant="outline" className="rounded-full text-xs leading-4 px-4 h-8">
                        <MessageCircle className="size-3 mr-1" />
                        Reply
                      </Button>
                    </div>
                  )}
                  {notif.type === "new_activity" && (
                    <div className="flex mt-2 gap-2">
                      <Button size="sm" className="rounded-full text-xs leading-4 px-4 h-8">
                        View
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full text-[#71717b] text-xs leading-4 px-4 h-8">
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    // Earlier (read) notifications use flat subtle card
    return (
      <motion.div
        key={notif.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.04 }}
        className="rounded-xl bg-zinc-100/50 flex p-4 gap-4"
      >
        <div
          className="flex-shrink-0 rounded-full flex justify-center items-center w-11 h-11"
          style={{ backgroundColor: config.bg }}
        >
          <IconComp className="size-5" style={{ color: config.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="font-medium text-zinc-950 text-sm leading-5">
                {notif.title}
              </p>
              <p className="text-[#71717b] text-xs leading-4 mt-1">
                {notif.body}
              </p>
            </div>
            <p className="whitespace-nowrap text-[#71717b] text-xs leading-4">
              {formatRelativeTime(notif.createdAt)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[68px] bg-white z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex mb-6 justify-between items-center">
          <h1 className="font-bold text-zinc-950 text-2xl leading-8">
            Notifications
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative" onClick={() => setScreen("map")}>
              <Settings className="size-5 text-[#71717b]" />
            </button>
            {unreadCount > 0 && (
              <button className="relative" onClick={markAllRead}>
                <CheckCheck className="size-5 text-[#8e51ff]" />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div
          className="overflow-x-auto flex mb-2 gap-2"
          style={{ scrollbarWidth: "none" }}
        >
          {FILTER_LABELS.map((label) => (
            <Badge
              key={label}
              variant={activeFilter === label ? "default" : "secondary"}
              className={`whitespace-nowrap font-medium rounded-full text-sm leading-5 px-4 py-1.5 cursor-pointer ${
                activeFilter === label
                  ? "bg-[#8e51ff] text-violet-50 hover:bg-[#8e51ff]/90"
                  : ""
              }`}
              onClick={() => setActiveFilter(label)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-7 h-7 border-2 border-zinc-200 border-t-[#8e51ff] rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
              <Bell size={26} className="text-[#71717b]" />
            </div>
            <p className="text-sm font-semibold text-zinc-950">No notifications yet</p>
            <p className="text-xs text-[#71717b] mt-1">You&apos;re all caught up</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="notifications-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* New section */}
              {newNotifications.length > 0 && (
                <div className="mb-6">
                  <p className="font-semibold uppercase text-[#71717b] text-xs leading-4 tracking-wider mb-4">
                    New
                  </p>
                  <div className="flex flex-col gap-4">
                    {newNotifications.map((notif, idx) =>
                      renderNotificationCard(notif, idx, true)
                    )}
                  </div>
                </div>
              )}

              {/* Earlier section */}
              {earlierNotifications.length > 0 && (
                <div className="mb-6">
                  <p className="font-semibold uppercase text-[#71717b] text-xs leading-4 tracking-wider mb-4">
                    Earlier
                  </p>
                  <div className="flex flex-col gap-4">
                    {earlierNotifications.map((notif, idx) =>
                      renderNotificationCard(notif, idx, false)
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
