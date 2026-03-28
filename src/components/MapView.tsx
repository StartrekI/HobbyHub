"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES, INTERESTS } from "@/lib/utils";
import type { ActivityType, UserType, HotspotType } from "@/types";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Search, Bell, X, MapPin, Clock, Users, MessageCircle,
  Info, Flame, User, Crosshair, Flag, Ban, UserPlus,
  Briefcase, Lightbulb, ChevronRight, Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function MapView() {
  const userLocation = useStore((s) => s.userLocation);
  const activities = useStore((s) => s.activities);
  const setActivities = useStore((s) => s.setActivities);
  const nearbyUsers = useStore((s) => s.nearbyUsers);
  const setNearbyUsers = useStore((s) => s.setNearbyUsers);
  const hotspots = useStore((s) => s.hotspots);
  const setHotspots = useStore((s) => s.setHotspots);
  const mapFilter = useStore((s) => s.mapFilter);
  const setMapFilter = useStore((s) => s.setMapFilter);
  const selectedActivity = useStore((s) => s.selectedActivity);
  const setSelectedActivity = useStore((s) => s.setSelectedActivity);
  const setScreen = useStore((s) => s.setScreen);
  const sheetOpen = useStore((s) => s.sheetOpen);
  const setSheetOpen = useStore((s) => s.setSheetOpen);
  const user = useStore((s) => s.user);
  const unreadCount = useStore((s) => s.unreadCount);
  const setUnreadCount = useStore((s) => s.setUnreadCount);
  const setCurrentChatId = useStore((s) => s.setCurrentChatId);
  const setOpportunityType = useStore((s) => s.setOpportunityType);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotType | null>(null);
  const [centerTrigger, setCenterTrigger] = useState(0);

  const locationRef = useRef(userLocation);
  const userIdRef = useRef(user?.id || "");
  locationRef.current = userLocation;
  userIdRef.current = user?.id || "";

  const detectHotspots = useCallback((acts: ActivityType[]) => {
    const clusters: Record<string, { activities: ActivityType[]; lat: number; lng: number }> = {};
    acts.forEach((a) => {
      const key = `${Math.round(a.lat * 200)}_${Math.round(a.lng * 200)}`;
      if (!clusters[key]) clusters[key] = { activities: [], lat: 0, lng: 0 };
      clusters[key].activities.push(a);
      clusters[key].lat += a.lat;
      clusters[key].lng += a.lng;
    });

    const hots: HotspotType[] = [];
    Object.values(clusters).forEach((c) => {
      if (c.activities.length >= 2) {
        const count = c.activities.length;
        hots.push({
          id: `h${hots.length}`,
          lat: c.lat / count,
          lng: c.lng / count,
          count: c.activities.reduce((s, a) => s + (a.participants?.length || 0), 0),
          label: c.activities[0].type,
          activities: c.activities,
        });
      }
    });
    setHotspots(hots);
  }, [setHotspots]);

  const fetchData = useCallback(async () => {
    const { lat, lng } = locationRef.current;
    const currentUserId = userIdRef.current;
    try {
      const res = await fetch(
        `/api/feed?lat=${lat}&lng=${lng}&radius=0.5&userId=${currentUserId}`
      );
      const data = await res.json();
      if (data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities);
        detectHotspots(data.activities);
      }
      if (data.users && Array.isArray(data.users)) {
        setNearbyUsers(
          data.users.map((u: UserType & { interests: string }) => {
            let interests = u.interests || [];
            try { if (typeof interests === "string") interests = JSON.parse(interests); } catch { interests = []; }
            return { ...u, interests };
          })
        );
      }
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, [setActivities, setNearbyUsers, setUnreadCount, detectHotspots]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!document.hidden) fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleActivityClick = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setSelectedUser(null);
    setSelectedHotspot(null);
    setSheetOpen(true);
  };

  const handleUserClick = (u: UserType) => {
    setSelectedUser(u);
    setSelectedActivity(null);
    setSelectedHotspot(null);
    setSheetOpen(true);
  };

  const handleHotspotClick = (h: HotspotType) => {
    setSelectedHotspot(h);
    setSelectedActivity(null);
    setSelectedUser(null);
    setSheetOpen(true);
  };

  const dismissSheet = () => {
    setSheetOpen(false);
    setSelectedActivity(null);
    setSelectedUser(null);
    setSelectedHotspot(null);
  };

  const handleJoin = async (activityId: string) => {
    if (!user) return;
    await fetch(`/api/activities/${activityId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    fetchData();
  };

  const handleSendDM = async (targetUser: UserType) => {
    if (!user) return;
    await fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: user.id, receiverId: targetUser.id, text: "Hi! 👋" }),
    });
    dismissSheet();
    setCurrentChatId(`dm:${targetUser.id}`);
    setScreen("chat");
  };

  const handleReport = async (targetUserId: string) => {
    if (!user) return;
    const reason = prompt("Reason for reporting this user:");
    if (!reason) return;
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterId: user.id, reportedId: targetUserId, reason }),
    });
    alert("Report submitted. Our team will review it.");
  };

  const handleBlock = async (targetUserId: string) => {
    if (!user) return;
    if (!confirm("Block this user? They won't be able to message you.")) return;
    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockerId: user.id, blockedId: targetUserId }),
    });
    dismissSheet();
    fetchData();
  };

  const handleProfileRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/profile-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user.id, requestedId: targetUserId }),
      });
      if (res.ok) alert("Connection request sent!");
      else {
        const data = await res.json();
        alert(data.error || "Request failed");
      }
    } catch { alert("Request failed"); }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return {
      activities: activities.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.type.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      users: nearbyUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.interests.some((i: string) => i.includes(searchQuery.toLowerCase()))
      ),
    };
  }, [searchQuery, activities, nearbyUsers]);

  const onlineUsers = nearbyUsers.filter(u => u.id !== user?.id && u.online);

  const filters = [
    { key: "all" as const, label: "All" },
    { key: "activities" as const, label: "Activities" },
    { key: "people" as const, label: "People" },
    { key: "online" as const, label: "Online" },
    { key: "hotspots" as const, label: "Hotspots" },
  ];

  const userInterests = useMemo(() => {
    if (!user?.interests) return [];
    return Array.isArray(user.interests) ? user.interests : JSON.parse(user.interests as string);
  }, [user?.interests]);

  const sharedInterests = useMemo(() => {
    if (!selectedUser) return [];
    return selectedUser.interests.filter((i: string) => userInterests.includes(i));
  }, [selectedUser, userInterests]);

  const dragControls = useDragControls();

  return (
    <div className="relative h-full w-full">
      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none">
        <div className="flex gap-2">
          <div
            onClick={() => setSearchOpen(true)}
            className="flex-1 flex items-center gap-3 bg-[#1a1a2e]/90 backdrop-blur-xl rounded-2xl px-4 py-3.5 shadow-[0_4px_20px_rgba(26,26,46,0.2)] pointer-events-auto cursor-pointer hover:bg-[#1a1a2e]/95 transition-all"
          >
            <Search size={16} className="text-white/40" />
            <span className="text-white/40 text-[13px]">Search activities, people...</span>
          </div>
          <button
            onClick={() => setScreen("notifications")}
            className="relative w-[48px] h-[48px] bg-[#1a1a2e]/90 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(26,26,46,0.2)] flex items-center justify-center pointer-events-auto hover:bg-[#1a1a2e]/95 transition-all"
          >
            <Bell size={17} className="text-white/70" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff6b6b] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#1a1a2e]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2.5 pointer-events-auto">
          {filters.map((f) => {
            const count = f.key === "all" ? activities.length + nearbyUsers.filter(u => u.id !== user?.id).length
              : f.key === "activities" ? activities.length
              : f.key === "people" ? nearbyUsers.filter(u => u.id !== user?.id).length
              : f.key === "online" ? onlineUsers.length
              : hotspots.length;
            const active = mapFilter === f.key;
            return (
              <motion.button
                key={f.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMapFilter(f.key)}
                className={`px-3.5 py-[6px] rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? "bg-[#6c5ce7] text-white shadow-[0_0_12px_rgba(108,92,231,0.4)]"
                    : "bg-[#1a1a2e]/70 backdrop-blur-md text-white/50 hover:bg-[#1a1a2e]/85"
                }`}
              >
                {f.label}
                {count > 0 && <span className={`ml-1 ${active ? "text-white/70" : "text-white/30"}`}>{count}</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Live Stats Pill ── */}
      {(activities.length > 0 || nearbyUsers.length > 0) && (
        <div className="absolute top-[108px] left-3 z-[490]">
          <div className="bg-[#1a1a2e]/80 backdrop-blur-xl rounded-full px-3 py-1.5 shadow-[0_2px_12px_rgba(26,26,46,0.15)] flex items-center gap-2.5 text-[10px] font-semibold">
            <span className="flex items-center gap-1 text-[#a29bfe]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#6c5ce7] animate-pulse" />
              {activities.length} active
            </span>
            <span className="w-px h-2.5 bg-white/10" />
            <span className="flex items-center gap-1 text-[#00b894]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#00b894]" />
              {onlineUsers.length} online
            </span>
            <span className="w-px h-2.5 bg-white/10" />
            <span className="flex items-center gap-1 text-white/40">
              {nearbyUsers.filter(u => u.id !== user?.id).length} nearby
            </span>
          </div>
        </div>
      )}

      {/* ── Map ── */}
      <LeafletMap
        userLocation={userLocation}
        activities={mapFilter === "all" || mapFilter === "activities" ? activities : mapFilter === "online" ? [] : []}
        users={
          mapFilter === "online" ? onlineUsers
          : mapFilter === "all" || mapFilter === "people" ? nearbyUsers.filter((u) => u.id !== user?.id)
          : []
        }
        hotspots={mapFilter === "all" || mapFilter === "hotspots" ? hotspots : []}
        onActivityClick={handleActivityClick}
        onUserClick={handleUserClick}
        onHotspotClick={handleHotspotClick}
        centerTrigger={centerTrigger}
      />

      {/* ── FAB Buttons ── */}
      <div className="absolute bottom-28 right-3 z-[500] flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCenterTrigger((c) => c + 1)}
          className="w-11 h-11 bg-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_16px_rgba(26,26,46,0.2)] flex items-center justify-center text-white/70 hover:bg-[#1a1a2e]/90 transition-all"
        >
          <Crosshair size={17} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen("networking")}
          className="w-12 h-12 bg-[#00b894] rounded-2xl shadow-[0_4px_20px_rgba(0,184,148,0.4)] flex items-center justify-center text-white transition-shadow hover:shadow-[0_6px_24px_rgba(0,184,148,0.5)]"
        >
          <Briefcase size={18} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { setOpportunityType("gig"); setScreen("create-opportunity"); }}
          className="w-11 h-11 bg-[#fdcb6e] rounded-2xl shadow-[0_4px_20px_rgba(253,203,110,0.4)] flex items-center justify-center text-[#1a1a2e] transition-shadow hover:shadow-[0_6px_24px_rgba(253,203,110,0.5)]"
        >
          <Lightbulb size={16} />
        </motion.button>
      </div>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[#13132b] z-[2000]"
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-white/40 hover:text-white/70 transition-colors">
                <X size={20} />
              </button>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities, people, hobbies..."
                className="flex-1 text-[15px] outline-none bg-transparent text-white placeholder:text-white/30"
              />
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-58px)]">
              {!searchResults ? (
                <div className="text-center py-20">
                  <div className="w-14 h-14 bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-white/20" />
                  </div>
                  <p className="text-white/30 text-[13px]">Try &quot;badminton&quot;, &quot;cycling&quot;, or a name</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.activities.length > 0 && (
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-2 pt-2 pb-1">Activities</p>
                  )}
                  {searchResults.activities.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => { handleActivityClick(a); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                        style={{ background: `${TYPE_COLORS[a.type]}20` }}
                      >
                        {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-white truncate">{a.title}</p>
                        <p className="text-[11px] text-white/40">
                          {a.participants?.length || 0}/{a.playersNeeded} joined
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  ))}
                  {searchResults.users.length > 0 && (
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-2 pt-4 pb-1">People</p>
                  )}
                  {searchResults.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition-colors"
                      onClick={() => { handleUserClick(u); setSearchOpen(false); setSearchQuery(""); }}>
                      <div className="w-10 h-10 rounded-xl bg-[#6c5ce7] text-white flex items-center justify-center font-bold text-[13px] overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-white">{u.name}</p>
                        <p className="text-[11px] text-white/40">
                          {u.online ? "Online" : "Offline"} &bull; {u.interests.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  ))}
                  {searchResults.activities.length === 0 && searchResults.users.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={24} className="text-white/20" />
                      </div>
                      <p className="text-white/30 text-[13px]">No results found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sheet Backdrop ── */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissSheet}
            className="absolute inset-0 z-[790] bg-black/30 backdrop-blur-[3px]"
          />
        )}
      </AnimatePresence>

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) dismissSheet();
            }}
            className="absolute bottom-[68px] left-0 right-0 z-[800] bg-[#1a1a2e] rounded-t-[28px] shadow-[0_-12px_50px_rgba(0,0,0,0.25)] max-h-[55vh] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-8 h-1 rounded-full bg-white/15" />
            </div>

            <div className="overflow-y-auto max-h-[calc(55vh-24px)] px-5 pb-6">
              {/* ─ Activity Sheet ─ */}
              {selectedActivity && (
                <div>
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${TYPE_COLORS[selectedActivity.type]}20` }}
                    >
                      {ACTIVITY_TYPES.find((t) => t.value === selectedActivity.type)?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[16px] leading-tight text-white">{selectedActivity.title}</h3>
                      <p className="text-[13px] text-white/40 mt-0.5">by {selectedActivity.creator?.name}</p>
                    </div>
                  </div>

                  {selectedActivity.description && (
                    <p className="text-[13px] text-white/50 mb-4 leading-relaxed">{selectedActivity.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.07] rounded-lg text-[11px] font-medium text-white/60">
                      <MapPin size={11} className="text-[#a29bfe]" />{getDistance(userLocation.lat, userLocation.lng, selectedActivity.lat, selectedActivity.lng)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.07] rounded-lg text-[11px] font-medium text-white/60">
                      <Clock size={11} className="text-[#a29bfe]" />{new Date(selectedActivity.time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.07] rounded-lg text-[11px] font-medium text-white/60">
                      <Users size={11} className="text-[#a29bfe]" />{selectedActivity.participants?.length || 0}/{selectedActivity.playersNeeded}
                    </span>
                  </div>

                  {selectedActivity.participants && selectedActivity.participants.length > 0 && (
                    <div className="flex -space-x-2 mb-5">
                      {selectedActivity.participants.slice(0, 6).map((p) => (
                        <div key={p.id} className="w-8 h-8 rounded-full bg-[#6c5ce7] border-2 border-[#1a1a2e] flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                          {p.user.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : p.user.name.charAt(0)}
                        </div>
                      ))}
                      {selectedActivity.participants.length > 6 && (
                        <div className="w-8 h-8 rounded-full bg-white/[0.08] border-2 border-[#1a1a2e] flex items-center justify-center text-[10px] text-white/50 font-bold">
                          +{selectedActivity.participants.length - 6}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleJoin(selectedActivity.id)}
                      disabled={selectedActivity.participants?.some((p) => p.userId === user?.id)}
                      className={`flex-1 py-3 rounded-xl font-semibold text-[13px] transition-all ${
                        selectedActivity.participants?.some((p) => p.userId === user?.id)
                          ? "bg-[#00b894]/15 text-[#00b894]"
                          : "bg-[#6c5ce7] text-white shadow-[0_0_20px_rgba(108,92,231,0.4)]"
                      }`}
                    >
                      {selectedActivity.participants?.some((p) => p.userId === user?.id) ? "Joined" : "Join Activity"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { dismissSheet(); setScreen("activity-detail"); }}
                      className="w-12 py-3 bg-white/[0.07] rounded-xl flex items-center justify-center hover:bg-white/[0.12] transition-all"
                    >
                      <Info size={16} className="text-white/40" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ─ User Sheet ─ */}
              {selectedUser && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative">
                      <div className="w-13 h-13 rounded-2xl bg-[#6c5ce7] flex items-center justify-center text-white text-lg font-bold overflow-hidden">
                        {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" /> : <User size={22} />}
                      </div>
                      {selectedUser.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00b894] border-2 border-[#1a1a2e] rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-[16px] text-white">{selectedUser.name}</h3>
                        {selectedUser.verified && (
                          <span className="w-4 h-4 bg-[#6c5ce7] rounded-full flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-[13px] text-white/40">
                        {selectedUser.online ? (
                          <span className="text-[#00b894] font-medium">Online now</span>
                        ) : (
                          selectedUser.lastSeenAt
                            ? `Last seen ${(() => { const diff = Date.now() - new Date(selectedUser.lastSeenAt).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`; })()}`
                            : "Offline"
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedUser.bio && (
                    <p className="text-[13px] text-white/50 mb-3 leading-relaxed">{selectedUser.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedUser.interests.map((i: string) => {
                      const interest = INTERESTS.find((x) => x.id === i);
                      return interest ? (
                        <span key={i} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                          sharedInterests.includes(i) ? "bg-[#6c5ce7]/20 text-[#a29bfe]" : "bg-white/[0.07] text-white/50"
                        }`}>
                          {interest.icon} {interest.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {sharedInterests.length > 0 && (
                    <p className="text-[11px] text-[#a29bfe] mb-4 font-semibold flex items-center gap-1">
                      <Sparkles size={11} /> {sharedInterests.length} shared interest{sharedInterests.length > 1 ? "s" : ""}
                    </p>
                  )}

                  <div className="flex gap-2 mb-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSendDM(selectedUser)}
                      className="flex-1 py-3 bg-[#6c5ce7] text-white rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(108,92,231,0.4)]"
                    >
                      <MessageCircle size={15} /> Say Hi
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleProfileRequest(selectedUser.id)}
                      className="w-12 py-3 bg-white/[0.07] rounded-xl flex items-center justify-center hover:bg-white/[0.12] transition-all"
                    >
                      <UserPlus size={16} className="text-white/40" />
                    </motion.button>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleReport(selectedUser.id)}
                      className="flex-1 py-2 text-[11px] text-white/30 flex items-center justify-center gap-1 hover:text-[#ff6b6b] transition-colors rounded-lg hover:bg-[#ff6b6b]/10"
                    >
                      <Flag size={11} /> Report
                    </button>
                    <button
                      onClick={() => handleBlock(selectedUser.id)}
                      className="flex-1 py-2 text-[11px] text-white/30 flex items-center justify-center gap-1 hover:text-[#ff6b6b] transition-colors rounded-lg hover:bg-[#ff6b6b]/10"
                    >
                      <Ban size={11} /> Block
                    </button>
                  </div>
                </div>
              )}

              {/* ─ Hotspot Sheet ─ */}
              {selectedHotspot && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#ff6b6b] flex items-center justify-center text-white">
                      <Flame size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[16px] capitalize text-white">{selectedHotspot.label} Hotspot</h3>
                      <p className="text-[13px] text-white/40">{selectedHotspot.count} people active</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {selectedHotspot.activities.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => handleActivityClick(a)}
                        className="flex items-center gap-3 p-3 bg-white/[0.05] rounded-xl cursor-pointer hover:bg-white/[0.08] transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
                          style={{ background: `${TYPE_COLORS[a.type]}20` }}
                        >
                          {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[13px] text-white truncate">{a.title}</p>
                          <p className="text-[11px] text-white/40">{a.participants?.length || 0}/{a.playersNeeded} joined</p>
                        </div>
                        <ChevronRight size={14} className="text-white/20" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
