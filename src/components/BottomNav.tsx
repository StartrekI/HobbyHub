"use client";

import { Map, Plus, MessageCircle, User, Compass, Calendar } from "lucide-react";
import { useStore } from "@/store";
import { motion } from "framer-motion";

const navItems = [
  { screen: "map" as const, icon: Map, label: "Map" },
  { screen: "discover" as const, icon: Compass, label: "Discover" },
  { screen: "create" as const, icon: Plus, label: "", isCreate: true },
  { screen: "calendar" as const, icon: Calendar, label: "Calendar" },
  { screen: "chat-list" as const, icon: MessageCircle, label: "Chat" },
  { screen: "profile" as const, icon: User, label: "Profile" },
];

export default function BottomNav() {
  const { currentScreen, setScreen, setSheetOpen, unreadCount } = useStore();

  const handleNav = (screen: typeof navItems[number]["screen"]) => {
    setSheetOpen(false);
    setScreen(screen);
  };

  return (
    <nav className="h-[72px] flex items-center bg-white/70 backdrop-blur-2xl border-t border-gray-200/40 z-[1000] pb-[env(safe-area-inset-bottom)] px-2 shadow-[0_-4px_30px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen ||
          (item.screen === "chat-list" && currentScreen === "chat") ||
          (item.screen === "discover" && currentScreen === "networking");
        const Icon = item.icon;
        const showBadge = item.screen === "chat-list" && unreadCount > 0;

        if (item.isCreate) {
          return (
            <button
              key={item.screen}
              onClick={() => handleNav(item.screen)}
              className="flex-1 flex items-center justify-center"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="w-14 h-14 -mt-7 rounded-full bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-[0_6px_24px_rgba(108,92,231,0.55),0_0_12px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_28px_rgba(108,92,231,0.65),0_0_16px_rgba(139,92,246,0.4)] rotate-0 hover:rotate-90 transition-all duration-300"
              >
                <Icon size={24} strokeWidth={2.5} />
              </motion.div>
            </button>
          );
        }

        return (
          <button
            key={item.screen}
            onClick={() => handleNav(item.screen)}
            className="flex-1 flex flex-col items-center justify-center py-2 relative"
          >
            <motion.div
              animate={isActive ? { scale: 1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="relative flex flex-col items-center gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="navPill"
                  className="absolute inset-0 -mx-1 -my-0.5 bg-violet-50 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5 px-3 py-1">
                <div className="relative">
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-colors duration-200 ${isActive ? "text-violet-600" : "text-gray-400"}`}
                  />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold transition-colors duration-200 ${isActive ? "text-violet-600" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </div>
            </motion.div>
          </button>
        );
      })}
    </nav>
  );
}
