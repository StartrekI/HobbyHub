"use client";

import { Compass, FileText, Plus, MessageCircle, User } from "lucide-react";
import { useStore } from "@/store";

const navItems = [
  { screen: "discover" as const, icon: Compass, label: "Explore" },
  { screen: "feed" as const, icon: FileText, label: "Feed" },
  { screen: "create" as const, icon: Plus, label: "Create", isCreate: true },
  { screen: "chat-list" as const, icon: MessageCircle, label: "Messages" },
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
    <div className="bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around px-2 h-16 max-w-[430px] mx-auto">
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.screen ||
            (item.screen === "chat-list" && currentScreen === "chat") ||
            (item.screen === "feed" && currentScreen === "networking");
          const Icon = item.icon;
          const showBadge = item.screen === "chat-list" && unreadCount > 0;

          if (item.isCreate) {
            return (
              <button
                key={item.screen}
                onClick={() => handleNav(item.screen)}
                className="flex flex-col items-center justify-center gap-1"
              >
                <div className="w-11 h-11 rounded-full bg-[#8e51ff] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(142,81,255,0.35)]">
                  <Icon size={22} strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.screen}
              onClick={() => handleNav(item.screen)}
              className="flex flex-col items-center justify-center gap-1 min-w-[56px]"
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className={isActive ? "text-[#8e51ff]" : "text-[#71717b]"}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-[#8e51ff]" : "text-[#71717b]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
