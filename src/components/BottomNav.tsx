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
  const currentScreen = useStore((s) => s.currentScreen);
  const setScreen = useStore((s) => s.setScreen);
  const setSheetOpen = useStore((s) => s.setSheetOpen);
  const unreadCount = useStore((s) => s.unreadCount);

  const handleNav = (screen: typeof navItems[number]["screen"]) => {
    setSheetOpen(false);
    setScreen(screen);
  };

  return (
    <nav className="h-[68px] flex items-center bg-white/80 backdrop-blur-2xl border-t border-black/[0.04] z-[1000] pb-[env(safe-area-inset-bottom)] px-1">
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
                whileTap={{ scale: 0.88, rotate: 90 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="w-[46px] h-[46px] -mt-5 rounded-2xl bg-[#6c5ce7] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(108,92,231,0.45)]"
              >
                <Icon size={22} strokeWidth={2.5} />
              </motion.div>
            </button>
          );
        }

        return (
          <button
            key={item.screen}
            onClick={() => handleNav(item.screen)}
            className="flex-1 flex flex-col items-center justify-center py-2 relative group"
          >
            <div className="relative flex flex-col items-center gap-[2px]">
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 w-5 h-[3px] bg-[#6c5ce7] rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className={`transition-colors duration-200 ${isActive ? "text-[#6c5ce7]" : "text-[#9e9eb0] group-hover:text-[#6e6e82]"}`}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-[4px] bg-[#ff6b6b] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight transition-colors duration-200 ${isActive ? "text-[#6c5ce7]" : "text-[#9e9eb0] group-hover:text-[#6e6e82]"}`}>
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
