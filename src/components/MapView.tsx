"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES, INTERESTS } from "@/lib/utils";
import type { ActivityType, UserType, HotspotType } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, X, MapPin, Clock, Users, MessageCircle,
  Info, Flame, User, Crosshair, Flag, Ban, UserPlus,
  Briefcase, Plane, GraduationCap, Lightbulb,
} from "lucide-react";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function MapView() {
  const {
    userLocation, activities, setActivities, nearbyUsers, setNearbyUsers,
    hotspots, setHotspots, mapFilter, setMapFilter, selectedActivity,
    setSelectedActivity, setScreen, sheetOpen, setSheetOpen, user,
    unreadCount, setCurrentChatId,
  } = useStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotType | null>(null);
  const [centerTrigger, setCenterTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    const { lat, lng } = userLocation;
    try {
      const [activitiesRes, usersRes] = await Promise.all([
        fetch(`/api/activities?lat=${lat}&lng=${lng}&radius=0.05`),
        fetch(`/api/users?lat=${lat}&lng=${lng}&radius=0.05`),
      ]);
      const acts = await activitiesRes.json();
      const usrs = await usersRes.json();
      setActivities(acts);
      setNearbyUsers(
        usrs.map((u: UserType & { interests: string }) => ({
          ...u,
          interests: typeof u.interests === "string" ? JSON.parse(u.interests) : u.interests,
        }))
      );
      detectHotspots(acts);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, [userLocation, setActivities, setNearbyUsers]);

  // Also fetch notifications count
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      const unread = data.filter((n: { read: boolean }) => !n.read).length;
      useStore.getState().setUnreadCount(unread);
    } catch {}
  }, [user]);

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
    fetchNotifications();
    const interval = setInterval(() => {
      fetchData();
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchNotifications]);

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
    // Send an initial "Hi!" DM
    await fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: user.id, receiverId: targetUser.id, text: "Hi! 👋" }),
    });
    setSheetOpen(false);
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
    setSheetOpen(false);
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

  const searchResults = searchQuery.trim()
    ? {
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
      }
    : null;

  const filters = ["all", "activities", "people", "hotspots"] as const;

  // Compute shared interests for selected user
  const userInterests = user?.interests
    ? (Array.isArray(user.interests) ? user.interests : JSON.parse(user.interests as string))
    : [];
  const sharedInterests = selectedUser
    ? selectedUser.interests.filter((i: string) => userInterests.includes(i))
    : [];

  return (
    <div className="relative h-full w-full">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 flex gap-2 pointer-events-none bg-gradient-to-b from-gray-50/90 to-transparent">
        <div
          onClick={() => setSearchOpen(true)}
          className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-md pointer-events-auto cursor-pointer text-gray-400 text-sm"
        >
          <Search size={16} className="text-gray-500" />
          <span>Search activities, people...</span>
        </div>
        <button
          onClick={() => setScreen("notifications")}
          className="relative w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-auto"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Chips with counts */}
      <div className="absolute top-[68px] left-3 right-3 z-[500] flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => {
          const count = f === "all" ? activities.length + nearbyUsers.filter(u => u.id !== user?.id).length
            : f === "activities" ? activities.length
            : f === "people" ? nearbyUsers.filter(u => u.id !== user?.id).length
            : hotspots.length;
          return (
            <button
              key={f}
              onClick={() => setMapFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold shadow-md whitespace-nowrap transition-all ${
                mapFilter === f ? "bg-violet-600 text-white" : "bg-white text-gray-500"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Live Stats Bar */}
      {(activities.length > 0 || nearbyUsers.length > 0) && (
        <div className="absolute top-[108px] left-3 z-[500]">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-violet-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              {activities.length} activities
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {nearbyUsers.filter(u => u.id !== user?.id).length} people
            </span>
            {hotspots.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1 text-red-500 font-bold">
                  <Flame size={10} /> {hotspots.length} hotspots
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <LeafletMap
        userLocation={userLocation}
        activities={mapFilter === "all" || mapFilter === "activities" ? activities : []}
        users={mapFilter === "all" || mapFilter === "people" ? nearbyUsers.filter((u) => u.id !== user?.id) : []}
        hotspots={mapFilter === "all" || mapFilter === "hotspots" ? hotspots : []}
        onActivityClick={handleActivityClick}
        onUserClick={handleUserClick}
        onHotspotClick={handleHotspotClick}
        centerTrigger={centerTrigger}
      />

      {/* Quick Action Buttons */}
      <div className="absolute bottom-24 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => setCenterTrigger((c) => c + 1)}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-violet-600 hover:scale-110 transition-transform"
        >
          <Crosshair size={20} />
        </button>
        <button
          onClick={() => setScreen("networking")}
          className="w-12 h-12 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
          title="Networking"
        >
          <Briefcase size={18} />
        </button>
        <button
          onClick={() => { useStore.getState().setOpportunityType("gig"); setScreen("create-opportunity"); }}
          className="w-12 h-12 bg-amber-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
          title="Create Opportunity"
        >
          <Lightbulb size={18} />
        </button>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-50 z-[2000]"
          >
            <div className="flex items-center gap-2 p-3 border-b border-gray-200">
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                <X size={20} />
              </button>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search activities, people, hobbies...'
                className="flex-1 text-base outline-none"
              />
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
              {!searchResults ? (
                <p className="text-center text-gray-400 py-10 text-sm">Try &quot;badminton&quot;, &quot;cycling&quot;, or &quot;photography&quot;</p>
              ) : (
                <>
                  {searchResults.activities.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => { handleActivityClick(a); setSearchOpen(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ background: TYPE_COLORS[a.type] || "#6C5CE7" }}
                      >
                        {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{a.title}</p>
                        <p className="text-xs text-gray-500">
                          {a.participants?.length || 0}/{a.playersNeeded} joined
                        </p>
                      </div>
                    </div>
                  ))}
                  {searchResults.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer"
                      onClick={() => { handleUserClick(u); setSearchOpen(false); setSearchQuery(""); }}>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500">
                          {u.online ? "Online" : "Offline"} &bull; {u.interests.slice(0, 2).join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {searchResults.activities.length === 0 && searchResults.users.length === 0 && (
                    <p className="text-center text-gray-400 py-10 text-sm">No results found</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-[70px] left-0 right-0 z-[800] bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] max-h-[60vh] overflow-y-auto"
          >
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-gray-300 cursor-pointer" onClick={() => setSheetOpen(false)} />
            </div>

            {/* Activity Sheet */}
            {selectedActivity && (
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${TYPE_COLORS[selectedActivity.type]}20`, color: TYPE_COLORS[selectedActivity.type] }}
                  >
                    {ACTIVITY_TYPES.find((t) => t.value === selectedActivity.type)?.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedActivity.title}</h3>
                    <p className="text-sm text-gray-500">by {selectedActivity.creator?.name}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-violet-600" />{getDistance(userLocation.lat, userLocation.lng, selectedActivity.lat, selectedActivity.lng)}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-violet-600" />{new Date(selectedActivity.time).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Users size={14} className="text-violet-600" />{selectedActivity.participants?.length || 0}/{selectedActivity.playersNeeded}</span>
                </div>

                {selectedActivity.participants && selectedActivity.participants.length > 0 && (
                  <div className="flex -space-x-2 mb-4">
                    {selectedActivity.participants.slice(0, 6).map((p) => (
                      <div key={p.id} className="w-8 h-8 rounded-full bg-violet-300 border-2 border-white flex items-center justify-center text-xs text-white font-semibold">
                        {p.user.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoin(selectedActivity.id)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      selectedActivity.participants?.some((p) => p.userId === user?.id)
                        ? "bg-emerald-500 text-white"
                        : "bg-violet-600 text-white hover:bg-violet-700"
                    }`}
                  >
                    {selectedActivity.participants?.some((p) => p.userId === user?.id) ? "Joined" : "Join Activity"}
                  </button>
                  <button
                    onClick={() => { setSheetOpen(false); setScreen("activity-detail"); }}
                    className="px-5 py-3 border-2 border-gray-200 rounded-xl text-sm hover:border-violet-600 hover:text-violet-600 transition-all"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* User Sheet */}
            {selectedUser && (
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <User size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                      {selectedUser.verified && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{selectedUser.online ? "Online now" : "Offline"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUser.interests.map((i: string) => {
                    const interest = INTERESTS.find((x) => x.id === i);
                    return interest ? (
                      <span key={i} className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold">
                        {interest.icon} {interest.label}
                      </span>
                    ) : null;
                  })}
                </div>

                {sharedInterests.length > 0 && (
                  <p className="text-xs text-violet-600 mb-3 font-semibold">
                    {sharedInterests.length} shared interest{sharedInterests.length > 1 ? "s" : ""}!
                  </p>
                )}

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleSendDM(selectedUser)}
                    className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> Say Hi
                  </button>
                  <button
                    onClick={() => handleProfileRequest(selectedUser.id)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm hover:border-violet-600 hover:text-violet-600 transition-all"
                    title="Connect"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReport(selectedUser.id)}
                    className="flex-1 py-2 text-xs text-gray-400 flex items-center justify-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Flag size={12} /> Report
                  </button>
                  <button
                    onClick={() => handleBlock(selectedUser.id)}
                    className="flex-1 py-2 text-xs text-gray-400 flex items-center justify-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <Ban size={12} /> Block
                  </button>
                </div>
              </div>
            )}

            {/* Hotspot Sheet */}
            {selectedHotspot && (
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <Flame size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg capitalize">{selectedHotspot.label} Hotspot</h3>
                    <p className="text-sm text-gray-500">{selectedHotspot.count} people active</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedHotspot.activities.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleActivityClick(a)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: `${TYPE_COLORS[a.type]}20`, color: TYPE_COLORS[a.type] }}
                      >
                        {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.participants?.length || 0}/{a.playersNeeded} joined</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
