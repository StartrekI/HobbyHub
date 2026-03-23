"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Users, MessageCircle, Star } from "lucide-react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES } from "@/lib/utils";

export default function ActivityDetail() {
  const { user, userLocation, selectedActivity, setScreen, setCurrentChatId } = useStore();

  if (!selectedActivity) return null;

  const a = selectedActivity;
  const color = TYPE_COLORS[a.type] || "#6C5CE7";
  const dist = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
  const isJoined = a.participants?.some((p) => p.userId === user?.id);

  const handleJoin = async () => {
    if (!user) return;
    await fetch(`/api/activities/${a.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    // Refresh will happen via map polling
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
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <button onClick={() => setScreen("map")}><ArrowLeft size={20} /></button>
        <h3 className="flex-1 font-bold text-lg">Activity Details</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: `${color}20`, color }}
          >
            {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon}{" "}
            {a.type.charAt(0).toUpperCase() + a.type.slice(1)}
          </span>
          <h2 className="text-xl font-extrabold mb-2">{a.title}</h2>
          {a.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{a.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <MapPin size={14} className="text-violet-600" /> {dist}
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <Clock size={14} className="text-violet-600" /> {new Date(a.time).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <Users size={14} className="text-violet-600" /> {a.participants?.length || 0}/{a.playersNeeded}
            </span>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h4 className="font-bold mb-3">Participants ({a.participants?.length || 0})</h4>
          <div className="space-y-3">
            {a.participants?.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: color }}
                >
                  {p.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {p.user.name} {i === 0 && <span className="text-xs text-gray-400">(Host)</span>}
                    {p.userId === user?.id && <span className="text-xs text-violet-600"> (You)</span>}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Star size={10} /> {p.user.rating || 4.5}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-4 bg-gray-50">
        <button
          onClick={handleJoin}
          className={`flex-[2] py-3.5 rounded-xl font-bold text-sm transition-all ${
            isJoined ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"
          }`}
        >
          {isJoined ? "Joined" : "Join Activity"}
        </button>
        <button
          onClick={openChat}
          className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:border-violet-600 hover:text-violet-600 transition-all"
        >
          <MessageCircle size={16} /> Chat
        </button>
      </div>
    </motion.div>
  );
}
