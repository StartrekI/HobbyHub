"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
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
import CalendarView from "@/components/CalendarView";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const { onboarded, currentScreen, user, setUser, setUserLocation, setOnboarded } = useStore();
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
          setOnboarded(true);
        }
      }
    } catch {
      localStorage.removeItem("hobbyhub_user");
    }
    setLoading(false);
  }, [setUser, setOnboarded]);

  // Get real GPS location with throttled updates
  useEffect(() => {
    if (!navigator.geolocation) return;

    let lastPing = 0;
    let lastLat = 0;
    let lastLng = 0;

    const handlePosition = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = pos.coords;

      // Only update if moved > 50 meters or first time
      const dist = Math.sqrt((lat - lastLat) ** 2 + (lng - lastLng) ** 2);
      if (lastLat !== 0 && dist < 0.0005) return; // ~50m threshold

      lastLat = lat;
      lastLng = lng;
      setUserLocation({ lat, lng });

      // Throttle server pings to max once per 15 seconds
      const now = Date.now();
      if (now - lastPing < 15000) return;
      lastPing = now;

      const currentUser = useStore.getState().user;
      if (currentUser?.id) {
        fetch("/api/users/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, lat, lng }),
        }).catch(() => {});

        try {
          const saved = localStorage.getItem("hobbyhub_user");
          if (saved) {
            const data = JSON.parse(saved);
            localStorage.setItem("hobbyhub_user", JSON.stringify({ ...data, lat, lng }));
          }
        } catch {}
      }
    };

    navigator.geolocation.getCurrentPosition(handlePosition, () => {}, {
      enableHighAccuracy: true, timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(handlePosition, () => {}, {
      enableHighAccuracy: true,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-violet-700 via-indigo-500 to-purple-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center text-white flex flex-col items-center"
        >
          <div className="splash-glow splash-float w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5">
            <MapPin className="w-10 h-10 text-white" strokeWidth={2.25} />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl font-bold tracking-tight"
          >
            HobbyHub
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="text-sm mt-2 font-medium text-white/70"
          >
            Discover hobbies near you
          </motion.p>
        </motion.div>
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
          {currentScreen === "calendar" && <CalendarView key="calendar" />}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
