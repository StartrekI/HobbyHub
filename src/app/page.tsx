"use client";

import { useStore } from "@/store";
import { AnimatePresence } from "framer-motion";
import Onboarding from "@/components/Onboarding";
import MapView from "@/components/MapView";
import CreateActivity from "@/components/CreateActivity";
import ChatList from "@/components/ChatList";
import ChatScreen from "@/components/ChatScreen";
import ProfileScreen from "@/components/ProfileScreen";
import NotificationsScreen from "@/components/NotificationsScreen";
import ActivityDetail from "@/components/ActivityDetail";
import DiscoveryFeed from "@/components/DiscoveryFeed";
import NetworkingView from "@/components/NetworkingView";
import CreateOpportunityModal from "@/components/CreateOpportunityModal";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const { onboarded, currentScreen } = useStore();

  if (!onboarded) {
    return <Onboarding />;
  }

  return (
    <div className="h-full w-full max-w-[430px] mx-auto flex flex-col relative border-x border-gray-200 bg-gray-50">
      {/* Map is always rendered underneath */}
      <div className="flex-1 relative">
        <MapView />

        {/* Screen Overlays */}
        <AnimatePresence mode="wait">
          {currentScreen === "create" && <CreateActivity key="create" />}
          {currentScreen === "chat-list" && <ChatList key="chat-list" />}
          {currentScreen === "chat" && <ChatScreen key="chat" />}
          {currentScreen === "profile" && <ProfileScreen key="profile" />}
          {currentScreen === "notifications" && <NotificationsScreen key="notifications" />}
          {currentScreen === "activity-detail" && <ActivityDetail key="activity-detail" />}
          {currentScreen === "discover" && <DiscoveryFeed key="discover" />}
          {currentScreen === "networking" && <NetworkingView key="networking" />}
          {currentScreen === "create-opportunity" && <CreateOpportunityModal key="create-opportunity" />}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
