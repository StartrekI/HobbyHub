"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useStore } from "@/store";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import Onboarding from "@/components/Onboarding";
import MapView from "@/components/MapView";
import CreateActivity from "@/components/CreateActivity";
const ChatList = lazy(() => import("@/components/ChatList"));
const ChatScreen = lazy(() => import("@/components/ChatScreen"));
const ProfileScreen = lazy(() => import("@/components/ProfileScreen"));
import NotificationsScreen from "@/components/NotificationsScreen";
import ActivityDetail from "@/components/ActivityDetail";
const DiscoveryFeed = lazy(() => import("@/components/DiscoveryFeed"));
const NetworkingView = lazy(() => import("@/components/NetworkingView"));
import CreateOpportunityModal from "@/components/CreateOpportunityModal";
const CalendarView = lazy(() => import("@/components/CalendarView"));
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

        requestIdleCallback(() => {
          try {
            const saved = localStorage.getItem("hobbyhub_user");
            if (saved) {
              const data = JSON.parse(saved);
              localStorage.setItem("hobbyhub_user", JSON.stringify({ ...data, lat, lng }));
            }
          } catch {}
        });
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

  // ─── Real-time presence: instant online/offline ───
  useEffect(() => {
    const currentUser = useStore.getState().user;
    if (!currentUser?.id) return;

    const uid = currentUser.id;
    const socket = getSocket();

    // 1) Immediately mark online in DB + broadcast via socket
    fetch("/api/users/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid, online: true }),
    }).catch(() => {});
    socket.emit("user-online", uid);

    // 2) Listen for other users going online/offline — instant UI update
    const handlePresence = (data: { userId: string; online: boolean }) => {
      const { nearbyUsers, setNearbyUsers } = useStore.getState();
      const updated = nearbyUsers.map((u) =>
        u.id === data.userId ? { ...u, online: data.online, lastSeenAt: new Date().toISOString() } : u
      );
      setNearbyUsers(updated);
    };
    socket.on("presence-update", handlePresence);

    // 3) Tab visibility: hidden → offline, visible → online
    const handleVisibility = () => {
      if (document.hidden) {
        navigator.sendBeacon(
          "/api/users/presence",
          new Blob([JSON.stringify({ userId: uid, online: false })], { type: "application/json" })
        );
      } else {
        fetch("/api/users/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, online: true }),
        }).catch(() => {});
        socket.emit("user-online", uid);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 4) Page close: sendBeacon ensures DB write even if tab is killed
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        "/api/users/presence",
        new Blob([JSON.stringify({ userId: uid, online: false })], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("presence-update", handlePresence);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

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

  // Screens that overlay on top of the map
  const mapOverlayScreens = ["map", "create", "notifications", "activity-detail", "create-opportunity"];
  const showMap = mapOverlayScreens.includes(currentScreen);

  return (
    <div className="h-full w-full max-w-[430px] mx-auto flex flex-col relative border-x border-gray-200 bg-gray-50">
      <div className="flex-1 relative overflow-hidden">
        {showMap ? (
          <>
            <MapView />
            <AnimatePresence mode="wait">
              {currentScreen === "create" && <CreateActivity key="create" />}
              {currentScreen === "notifications" && <NotificationsScreen key="notifications" />}
              {currentScreen === "activity-detail" && <ActivityDetail key="activity-detail" />}
              {currentScreen === "create-opportunity" && <CreateOpportunityModal key="create-opportunity" />}
            </AnimatePresence>
          </>
        ) : (
          <Suspense fallback={<div className="h-full bg-[#f5f5f7]" />}>
            <AnimatePresence mode="wait">
              {currentScreen === "discover" && <DiscoveryFeed key="discover" />}
              {currentScreen === "calendar" && <CalendarView key="calendar" />}
              {currentScreen === "chat-list" && <ChatList key="chat-list" />}
              {currentScreen === "chat" && <ChatScreen key="chat" />}
              {currentScreen === "profile" && <ProfileScreen key="profile" />}
              {currentScreen === "networking" && <NetworkingView key="networking" />}
            </AnimatePresence>
          </Suspense>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
