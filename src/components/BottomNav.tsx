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
  const currentScreen = useStore((s) => s.currentScreen);
  const setScreen = useStore((s) => s.setScreen);
  const setSheetOpen = useStore((s) => s.setSheetOpen);
  const unreadCount = useStore((s) => s.unreadCount);

  const handleNav = (screen: typeof navItems[number]["screen"]) => {
    setSheetOpen(false);
    setScreen(screen);
  };

  return (
    <div className="h-[68px] flex items-start justify-center pt-1.5 z-[1000] pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center bg-[#1a1a2e] rounded-[22px] mx-3 px-1.5 py-1.5 shadow-[0_8px_32px_rgba(26,26,46,0.25)] w-full max-w-[400px]">
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
                  whileTap={{ scale: 0.85, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="w-11 h-11 rounded-2xl bg-[#6c5ce7] text-white flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.5)]"
                >
                  <Icon size={20} strokeWidth={2.5} />
                </motion.div>
              </button>
            );
          }

          return (
            <button
              key={item.screen}
              onClick={() => handleNav(item.screen)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 relative"
            >
              <motion.div
                className={`flex flex-col items-center gap-[1px] px-3 py-1.5 rounded-xl transition-colors duration-200 ${
                  isActive ? "bg-white/[0.12]" : ""
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative">
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className={`transition-colors duration-200 ${isActive ? "text-white" : "text-white/40"}`}
                  />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-[3px] bg-[#ff6b6b] text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#1a1a2e]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-semibold tracking-tight transition-colors duration-200 ${isActive ? "text-white" : "text-white/35"}`}>
                  {item.label}
                </span>
              </motion.div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
