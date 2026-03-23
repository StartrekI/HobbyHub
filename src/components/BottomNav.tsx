"use client";

import { Map, Plus, MessageCircle, User, Compass } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

const navItems = [
  { screen: "map" as const, icon: Map, label: "Map" },
  { screen: "discover" as const, icon: Compass, label: "Discover" },
  { screen: "create" as const, icon: Plus, label: "Create", isCreate: true },
  { screen: "chat-list" as const, icon: MessageCircle, label: "Chat" },
  { screen: "profile" as const, icon: User, label: "Profile" },
];

export default function BottomNav() {
  const { currentScreen, setScreen, setSheetOpen } = useStore();

  const handleNav = (screen: typeof navItems[number]["screen"]) => {
    setSheetOpen(false);
    setScreen(screen);
  };

  return (
    <nav className="h-[70px] flex items-center bg-white border-t border-gray-200 z-[1000] pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen ||
          (item.screen === "chat-list" && currentScreen === "chat");
        const Icon = item.icon;

        return (
          <button
            key={item.screen}
            onClick={() => handleNav(item.screen)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 transition-colors",
              isActive ? "text-violet-600" : "text-gray-400"
            )}
          >
            {item.isCreate ? (
              <div className="w-12 h-12 -mt-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(108,92,231,0.4)] hover:scale-110 transition-transform">
                <Icon size={22} />
              </div>
            ) : (
              <Icon size={20} />
            )}
            <span className="text-[11px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
