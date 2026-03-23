"use client";

import { Map, Plus, MessageCircle, User, Compass } from "lucide-react";
import { useStore } from "@/store";
import { motion } from "framer-motion";

const navItems = [
  { screen: "map" as const, icon: Map, label: "Map" },
  { screen: "discover" as const, icon: Compass, label: "Discover" },
  { screen: "create" as const, icon: Plus, label: "", isCreate: true },
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
    <nav className="h-[72px] flex items-center bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[1000] pb-[env(safe-area-inset-bottom)] px-2">
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
                whileTap={{ scale: 0.9 }}
                className="w-[52px] h-[52px] -mt-6 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(108,92,231,0.5)] rotate-0 hover:rotate-90 transition-transform duration-300"
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
            className="flex-1 flex flex-col items-center gap-0.5 py-2 relative"
          >
            <motion.div
              animate={isActive ? { scale: 1, y: -2 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`transition-colors duration-200 ${isActive ? "text-violet-600" : "text-gray-400"}`}
              />
              {showBadge && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.div>
            <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? "text-violet-600" : "text-gray-400"}`}>
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute -bottom-0 w-5 h-[3px] rounded-full bg-violet-600"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
