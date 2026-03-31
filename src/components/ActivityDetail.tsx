"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Users, MessageCircle, Star, Share2 } from "lucide-react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES } from "@/lib/utils";

export default function ActivityDetail() {
  const { user, userLocation, selectedActivity, setScreen, setCurrentChatId } = useStore();

  if (!selectedActivity) return null;

  const a = selectedActivity;
  const color = TYPE_COLORS[a.type] || "#8e51ff";
  const dist = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
  const isJoined = a.participants?.some((p) => p.userId === user?.id);
  const emoji = ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon || "\u2B50";

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
      className="absolute inset-0 bottom-[68px] bg-[#f8f8fa] z-[900] flex flex-col"
    >
      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd, ${color}aa)` }}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1.5px, transparent 1.5px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)", backgroundSize: "40px 40px, 60px 60px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 py-3 z-10">
          <button onClick={() => setScreen("map")} className="w-8 h-8 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/25 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="flex-1" />
        </div>
        <div className="relative z-[1] px-5 pt-16 pb-10 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl border border-white/10 shadow-lg">
              {emoji}
            </div>
            <div className="flex-1">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10">
                {a.type}
              </span>
              {a.isEvent && (
                <span className="ml-2 px-2.5 py-0.5 bg-amber-400/30 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider border border-amber-300/20">Event</span>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">{a.title}</h2>
          {a.description && (
            <p className="text-white/65 text-sm mt-2 leading-relaxed">{a.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mt-5">
        {/* Info Cards */}
        <div className="mx-4 bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3.5 rounded-xl bg-zinc-50">
              <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${color}15` }}>
                <MapPin size={16} style={{ color }} />
              </div>
              <p className="text-xs font-bold text-zinc-950">{dist}</p>
              <p className="text-[10px] text-[#71717b] font-medium">Distance</p>
            </div>
            <div className="text-center p-3.5 rounded-xl bg-zinc-50">
              <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${color}15` }}>
                <Clock size={16} style={{ color }} />
              </div>
              <p className="text-xs font-bold text-zinc-950">{new Date(a.time).toLocaleDateString([], { month: "short", day: "numeric" })}</p>
              <p className="text-[10px] text-[#71717b] font-medium">{new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="text-center p-3.5 rounded-xl bg-zinc-50">
              <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${color}15` }}>
                <Users size={16} style={{ color }} />
              </div>
              <p className="text-xs font-bold text-zinc-950">{a.participants?.length || 0}/{a.playersNeeded}</p>
              <p className="text-[10px] text-[#71717b] font-medium">Joined</p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mx-4 mt-4 bg-white rounded-xl p-4 border border-zinc-100">
          <h4 className="font-bold text-sm text-zinc-950 mb-4 flex items-center gap-2">Participants <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: `${color}12`, color }}>{a.participants?.length || 0}</span></h4>
          <div className="space-y-2.5">
            {a.participants?.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                <div className="p-[2px] rounded-[14px]" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold overflow-hidden bg-zinc-100"
                    style={{ background: p.user.avatar ? undefined : `linear-gradient(135deg, ${color}, ${color}cc)` }}
                  >
                    {p.user.avatar ? <img src={p.user.avatar} alt="" className="w-full h-full object-cover" /> : p.user.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-zinc-950 flex items-center gap-2">
                    {p.user.name}
                    {i === 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100/60">Host</span>}
                    {p.userId === user?.id && <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-lg border border-violet-100/60">You</span>}
                  </p>
                  <p className="text-xs text-[#71717b] flex items-center gap-1">
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
      <div className="flex gap-2 p-4 bg-white border-t border-zinc-100">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleJoin}
          disabled={isJoined}
          className={`flex-[2] py-3 rounded-xl font-semibold text-[13px] transition-all ${
            isJoined
              ? "bg-[#e6f9f4] text-[#00b894] border border-[#00b894]/20"
              : "bg-[#8e51ff] text-white shadow-[0_4px_16px_rgba(142,81,255,0.35)]"
          }`}
        >
          {isJoined ? "Joined" : "Join Activity"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openChat}
          className="flex-1 py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 text-[#8e51ff] bg-[#8e51ff]/10 border border-[#8e51ff]/15"
        >
          <MessageCircle size={15} /> Chat
        </motion.button>
      </div>
    </motion.div>
  );
}
