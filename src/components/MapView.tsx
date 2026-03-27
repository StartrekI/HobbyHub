"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

  const fetchData = useCallback(async () => {
    const { lat, lng } = userLocation;
    const currentUserId = user?.id || "";
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
  }, [userLocation, user, setActivities, setNearbyUsers, setUnreadCount]);

  const detectHotspots = (acts: ActivityType[]) => {
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
  };

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
      {/* Top Bar — Glass */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 flex gap-2.5 pointer-events-none">
        <div
          onClick={() => setSearchOpen(true)}
          className="flex-1 flex items-center gap-3 bg-white/80 backdrop-blur-2xl rounded-2xl px-4 py-3.5 shadow-[0_2px_16px_rgba(0,0,0,0.06),inset_0_1px_3px_rgba(0,0,0,0.04)] border border-white/60 pointer-events-auto cursor-pointer transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.08),inset_0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <Search size={18} className="text-gray-400" />
          <span className="text-gray-400 text-sm">Search activities, people...</span>
        </div>
        <button
          onClick={() => setScreen("notifications")}
          className="relative w-12 h-12 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-white/60 flex items-center justify-center pointer-events-auto hover:bg-white/90 transition-colors"
        >
          <Bell size={18} className="text-gray-600" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-gradient-to-br from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.4)] ring-2 ring-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Filter Chips */}
      <div className="absolute top-[72px] left-3 right-3 z-[500] flex gap-2 overflow-x-auto no-scrollbar">
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
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border ${
                active
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_2px_12px_rgba(124,58,237,0.3)]"
                  : "bg-white/85 backdrop-blur-lg text-gray-600 border-gray-100/80 shadow-sm hover:bg-white/95"
              }`}
            >
              {f.label}
              {count > 0 && <span className={`ml-1 ${active ? "opacity-80" : "opacity-50"}`}>({count})</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Live Stats */}
      {(activities.length > 0 || nearbyUsers.length > 0) && (
        <div className="absolute top-[116px] left-3 z-[490]">
          <div className="bg-white/80 backdrop-blur-2xl rounded-full px-3 py-1.5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] border border-white/50 flex items-center gap-2.5 text-[11px]">
            <span className="flex items-center gap-1 text-violet-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              {activities.length} active
            </span>
            <span className="w-px h-3 bg-gray-200/80" />
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineUsers.length} online
            </span>
            <span className="w-px h-3 bg-gray-200/80" />
            <span className="flex items-center gap-1 text-gray-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              {nearbyUsers.filter(u => u.id !== user?.id).length} nearby
            </span>
          </div>
        </div>
      )}

      {/* Map */}
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

      {/* FAB Buttons */}
      <div className="absolute bottom-28 right-4 z-[500] flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setCenterTrigger((c) => c + 1)}
          className="w-12 h-12 bg-white/85 backdrop-blur-2xl rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-white/60 flex items-center justify-center text-violet-600 hover:bg-white/95 active:bg-white transition-colors"
        >
          <Crosshair size={20} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setScreen("networking")}
          className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] flex items-center justify-center text-white hover:shadow-[0_6px_24px_rgba(16,185,129,0.45)] active:shadow-[0_2px_12px_rgba(16,185,129,0.3)] transition-shadow"
        >
          <Briefcase size={20} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { setOpportunityType("gig"); setScreen("create-opportunity"); }}
          className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-[0_4px_16px_rgba(245,158,11,0.3)] flex items-center justify-center text-white hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] active:shadow-[0_2px_10px_rgba(245,158,11,0.25)] transition-shadow"
        >
          <Lightbulb size={18} />
        </motion.button>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white z-[2000]"
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities, people, hobbies..."
                className="flex-1 text-base outline-none bg-transparent"
              />
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
              {!searchResults ? (
                <div className="text-center py-16">
                  <Search size={40} className="mx-auto mb-4 text-gray-200" />
                  <p className="text-gray-400 text-sm">Try &quot;badminton&quot;, &quot;cycling&quot;, or a name</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.activities.length > 0 && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2 pt-2 pb-1">Activities</p>
                  )}
                  {searchResults.activities.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => { handleActivityClick(a); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${TYPE_COLORS[a.type]}15`, color: TYPE_COLORS[a.type] }}
                      >
                        {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.title}</p>
                        <p className="text-xs text-gray-400">
                          {a.participants?.length || 0}/{a.playersNeeded} joined
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  ))}
                  {searchResults.users.length > 0 && (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2 pt-4 pb-1">People</p>
                  )}
                  {searchResults.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => { handleUserClick(u); setSearchOpen(false); setSearchQuery(""); }}>
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold overflow-hidden">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400">
                          {u.online ? "Online" : "Offline"} &bull; {u.interests.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  ))}
                  {searchResults.activities.length === 0 && searchResults.users.length === 0 && (
                    <div className="text-center py-16">
                      <Sparkles size={40} className="mx-auto mb-4 text-gray-200" />
                      <p className="text-gray-400 text-sm">No results found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Backdrop — tap to dismiss */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissSheet}
            className="absolute inset-0 z-[790] bg-black/20"
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) dismissSheet();
            }}
            className="absolute bottom-[72px] left-0 right-0 z-[800] bg-white rounded-t-[28px] shadow-[0_-12px_48px_rgba(0,0,0,0.1),0_-2px_8px_rgba(0,0,0,0.04)] max-h-[55vh] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3.5 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-9 h-[5px] rounded-full bg-gray-200/80" />
            </div>

            <div className="overflow-y-auto max-h-[calc(55vh-28px)] px-5 pb-6">
              {/* Activity Sheet */}
              {selectedActivity && (
                <div>
                  <div className="flex items-start gap-3.5 mb-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                      style={{ background: `${TYPE_COLORS[selectedActivity.type]}12`, color: TYPE_COLORS[selectedActivity.type] }}
                    >
                      {ACTIVITY_TYPES.find((t) => t.value === selectedActivity.type)?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[17px] leading-tight tracking-tight">{selectedActivity.title}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">by {selectedActivity.creator?.name}</p>
                    </div>
                  </div>

                  {selectedActivity.description && (
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{selectedActivity.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/80 rounded-xl text-xs font-medium text-gray-600 border border-gray-100/60">
                      <MapPin size={13} className="text-violet-500" />{getDistance(userLocation.lat, userLocation.lng, selectedActivity.lat, selectedActivity.lng)}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/80 rounded-xl text-xs font-medium text-gray-600 border border-gray-100/60">
                      <Clock size={13} className="text-violet-500" />{new Date(selectedActivity.time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/80 rounded-xl text-xs font-medium text-gray-600 border border-gray-100/60">
                      <Users size={13} className="text-violet-500" />{selectedActivity.participants?.length || 0}/{selectedActivity.playersNeeded}
                    </span>
                  </div>

                  {selectedActivity.participants && selectedActivity.participants.length > 0 && (
                    <div className="flex -space-x-2 mb-5">
                      {selectedActivity.participants.slice(0, 6).map((p) => (
                        <div key={p.id} className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 border-[2.5px] border-white flex items-center justify-center text-xs text-white font-bold overflow-hidden shadow-sm">
                          {p.user.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : p.user.name.charAt(0)}
                        </div>
                      ))}
                      {selectedActivity.participants.length > 6 && (
                        <div className="w-9 h-9 rounded-full bg-gray-100 border-[2.5px] border-white flex items-center justify-center text-xs text-gray-500 font-bold">
                          +{selectedActivity.participants.length - 6}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleJoin(selectedActivity.id)}
                      disabled={selectedActivity.participants?.some((p) => p.userId === user?.id)}
                      className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                        selectedActivity.participants?.some((p) => p.userId === user?.id)
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(124,58,237,0.3)]"
                      }`}
                    >
                      {selectedActivity.participants?.some((p) => p.userId === user?.id) ? "Joined ✓" : "Join Activity"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { dismissSheet(); setScreen("activity-detail"); }}
                      className="w-14 py-3.5 border border-gray-200/80 rounded-2xl flex items-center justify-center hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                    >
                      <Info size={18} className="text-gray-400" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* User Sheet */}
              {selectedUser && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-sm">
                        {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" /> : <User size={24} />}
                      </div>
                      {selectedUser.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-[2.5px] border-white rounded-full shadow-sm" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[17px] tracking-tight">{selectedUser.name}</h3>
                        {selectedUser.verified && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-bold rounded-full ring-1 ring-blue-100">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {selectedUser.online ? (
                          <span className="text-emerald-500 font-medium">Online now</span>
                        ) : (
                          selectedUser.lastSeenAt
                            ? `Last seen ${(() => { const diff = Date.now() - new Date(selectedUser.lastSeenAt).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h ago`; return `${Math.floor(hrs / 24)}d ago`; })()}`
                            : "Offline"
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedUser.bio && (
                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">{selectedUser.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedUser.interests.map((i: string) => {
                      const interest = INTERESTS.find((x) => x.id === i);
                      return interest ? (
                        <span key={i} className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
                          sharedInterests.includes(i) ? "bg-violet-50 text-violet-600 ring-1 ring-violet-200/80" : "bg-gray-50/80 text-gray-500 border border-gray-100/60"
                        }`}>
                          {interest.icon} {interest.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {sharedInterests.length > 0 && (
                    <p className="text-xs text-violet-500 mb-4 font-semibold flex items-center gap-1">
                      <Sparkles size={12} /> {sharedInterests.length} shared interest{sharedInterests.length > 1 ? "s" : ""}
                    </p>
                  )}

                  <div className="flex gap-2.5 mb-3">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSendDM(selectedUser)}
                      className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(124,58,237,0.3)]"
                    >
                      <MessageCircle size={16} /> Say Hi
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleProfileRequest(selectedUser.id)}
                      className="w-14 py-3.5 border border-gray-200/80 rounded-2xl flex items-center justify-center hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                    >
                      <UserPlus size={18} className="text-gray-400" />
                    </motion.button>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-gray-100/80">
                    <button
                      onClick={() => handleReport(selectedUser.id)}
                      className="flex-1 py-2 text-xs text-gray-400 flex items-center justify-center gap-1 hover:text-red-400 transition-colors rounded-xl hover:bg-red-50/50"
                    >
                      <Flag size={12} /> Report
                    </button>
                    <button
                      onClick={() => handleBlock(selectedUser.id)}
                      className="flex-1 py-2 text-xs text-gray-400 flex items-center justify-center gap-1 hover:text-red-400 transition-colors rounded-xl hover:bg-red-50/50"
                    >
                      <Ban size={12} /> Block
                    </button>
                  </div>
                </div>
              )}

              {/* Hotspot Sheet */}
              {selectedHotspot && (
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white shadow-sm">
                      <Flame size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[17px] capitalize tracking-tight">{selectedHotspot.label} Hotspot</h3>
                      <p className="text-sm text-gray-400">{selectedHotspot.count} people active</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedHotspot.activities.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => handleActivityClick(a)}
                        className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-2xl cursor-pointer hover:bg-gray-100/80 transition-all border border-gray-100/50"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm"
                          style={{ background: `${TYPE_COLORS[a.type]}12`, color: TYPE_COLORS[a.type] }}
                        >
                          {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{a.title}</p>
                          <p className="text-xs text-gray-400">{a.participants?.length || 0}/{a.playersNeeded} joined</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
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
