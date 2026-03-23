"use client";

import { useEffect, useState } from "react";
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
  const { onboarded, currentScreen, setUser, setUserLocation, setOnboarded } = useStore();
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("hobbyhub_user");
      if (savedUser) {
        const data = JSON.parse(savedUser);
        if (data.id && data.email) {
          setUser({
            ...data,
            interests: typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests || [],
            skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills || [],
          });
          if (data.lat || data.lng) {
            setUserLocation({ lat: data.lat, lng: data.lng });
          }
          setOnboarded(true);

          // Ping server in background (non-blocking)
          fetch("/api/users/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.id, lat: data.lat || 0, lng: data.lng || 0 }),
          }).catch(() => {});
        }
      }
    } catch {
      localStorage.removeItem("hobbyhub_user");
    }
    setLoading(false);
  }, [setUser, setUserLocation, setOnboarded]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-400">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="font-semibold">Loading HobbyHub...</p>
        </div>
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding />;
  }

  return (
    <div className="h-full w-full max-w-[430px] mx-auto flex flex-col relative border-x border-gray-200 bg-gray-50">
      <div className="flex-1 relative">
        <MapView />
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
      <BottomNav />
    </div>
  );
}
