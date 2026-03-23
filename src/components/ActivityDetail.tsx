"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Users, MessageCircle, Star, Share2 } from "lucide-react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES } from "@/lib/utils";

export default function ActivityDetail() {
  const { user, userLocation, selectedActivity, setScreen, setCurrentChatId } = useStore();

  if (!selectedActivity) return null;

  const a = selectedActivity;
  const color = TYPE_COLORS[a.type] || "#6C5CE7";
  const dist = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
  const isJoined = a.participants?.some((p) => p.userId === user?.id);
  const emoji = ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon || "⭐";

  const handleJoin = async () => {
    if (!user || isJoined) return;
    await fetch(`/api/activities/${a.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    setScreen("map");
  };

  const openChat = () => {
    setCurrentChatId(a.id);
    setScreen("chat");
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Hero Header */}
      <div className="relative" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-3 z-10">
          <button onClick={() => setScreen("map")} className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </button>
          <span className="flex-1" />
        </div>
        <div className="px-5 pt-16 pb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl">
              {emoji}
            </div>
            <div className="flex-1">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-wide">
                {a.type}
              </span>
              {a.isEvent && (
                <span className="ml-2 px-2.5 py-0.5 bg-amber-400/30 rounded-lg text-[10px] font-bold uppercase tracking-wide">Event</span>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-extrabold leading-tight">{a.title}</h2>
          {a.description && (
            <p className="text-white/70 text-sm mt-2 leading-relaxed">{a.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mt-4">
        {/* Info Cards */}
        <div className="mx-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-2xl">
              <MapPin size={18} className="mx-auto mb-1.5" style={{ color }} />
              <p className="text-xs font-bold text-gray-800">{dist}</p>
              <p className="text-[10px] text-gray-400">Distance</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-2xl">
              <Clock size={18} className="mx-auto mb-1.5" style={{ color }} />
              <p className="text-xs font-bold text-gray-800">{new Date(a.time).toLocaleDateString([], { month: "short", day: "numeric" })}</p>
              <p className="text-[10px] text-gray-400">{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-2xl">
              <Users size={18} className="mx-auto mb-1.5" style={{ color }} />
              <p className="text-xs font-bold text-gray-800">{a.participants?.length || 0}/{a.playersNeeded}</p>
              <p className="text-[10px] text-gray-400">Joined</p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mx-4 mt-4 bg-white rounded-3xl p-5 border border-gray-100">
          <h4 className="font-bold text-sm mb-4">Participants ({a.participants?.length || 0})</h4>
          <div className="space-y-3">
            {a.participants?.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                >
                  {p.user.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : p.user.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {p.user.name}
                    {i === 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg">Host</span>}
                    {p.userId === user?.id && <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-lg">You</span>}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Star size={10} className="text-amber-400" /> {p.user.rating || 4.5}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleJoin}
          disabled={isJoined}
          className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm transition-all ${
            isJoined
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-violet-600 text-white shadow-md shadow-violet-200"
          }`}
        >
          {isJoined ? "Joined ✓" : "Join Activity"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openChat}
          className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 hover:border-violet-300 transition-colors"
        >
          <MessageCircle size={16} className="text-violet-500" /> Chat
        </motion.button>
      </div>
    </motion.div>
  );
}
