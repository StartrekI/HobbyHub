"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Filter, MessageCircle, UserPlus, Briefcase, X } from "lucide-react";
import { useStore } from "@/store";
import { getDistance, USER_ROLES, STARTUP_STAGES, LOOKING_FOR_OPTIONS } from "@/lib/utils";
import type { UserType } from "@/types";

export default function NetworkingView() {
  const { user, userLocation, setScreen, setCurrentChatId } = useStore();
  const [people, setPeople] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [lookingForFilter, setLookingForFilter] = useState("");
  const [search, setSearch] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchPeople = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(userLocation.lat),
      lng: String(userLocation.lng),
      userId: user.id,
    });
    if (roleFilter) params.set("role", roleFilter);
    if (stageFilter) params.set("stage", stageFilter);
    if (lookingForFilter) params.set("lookingFor", lookingForFilter);

    fetch(`/api/networking?${params}`)
      .then((r) => r.json())
      .then((data) => { setPeople(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, userLocation, roleFilter, stageFilter, lookingForFilter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPeople, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchPeople]);

  const filtered = search
    ? people.filter((p) =>
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.role || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.company || "").toLowerCase().includes(search.toLowerCase())
      )
    : people;

  const sendHi = (personId: string) => {
    if (!user) return;
    fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: user.id, receiverId: personId, text: "Hey! Let's connect 🤝" }),
    }).then(() => {
      setCurrentChatId(`dm:${personId}`);
      setScreen("chat");
    });
  };

  const roleInfo = (r: string) => USER_ROLES.find((x) => x.value === r);
  const stageInfo = (s: string) => STARTUP_STAGES.find((x) => x.value === s);
  const activeFilters = [roleFilter, stageFilter, lookingForFilter].filter(Boolean).length;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setScreen("map")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h3 className="flex-1 font-bold text-xl">Networking</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showFilters ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-400"}`}
          >
            <Filter size={18} />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>
            )}
          </motion.button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, roles, companies..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-3 overflow-hidden"
            >
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Role</label>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  <button onClick={() => setRoleFilter("")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${!roleFilter ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200/50" : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500"}`}>All</button>
                  {USER_ROLES.map((r) => (
                    <button key={r.value} onClick={() => setRoleFilter(r.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${roleFilter === r.value ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200/50" : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500"}`}>
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Stage</label>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  <button onClick={() => setStageFilter("")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${!stageFilter ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200/50" : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500"}`}>All</button>
                  {STARTUP_STAGES.map((s) => (
                    <button key={s.value} onClick={() => setStageFilter(s.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${stageFilter === s.value ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200/50" : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500"}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Looking For</label>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  <button onClick={() => setLookingForFilter("")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${!lookingForFilter ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200/50" : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500"}`}>All</button>
                  {LOOKING_FOR_OPTIONS.map((l) => (
                    <button key={l.value} onClick={() => setLookingForFilter(l.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${lookingForFilter === l.value ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200/50" : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500"}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4">
              <Briefcase size={28} className="text-emerald-300" />
            </div>
            <p className="text-sm font-medium">No professionals nearby</p>
            <p className="text-xs text-gray-300 mt-1">Try expanding your filters</p>
          </div>
        ) : (
          filtered.map((person, idx) => {
            const dist = getDistance(userLocation.lat, userLocation.lng, person.lat, person.lng);
            const role = roleInfo(person.role);
            const stage = stageInfo(person.startupStage);
            let personSkills: string[] = [];
            try {
              personSkills = typeof person.skills === "string"
                ? JSON.parse(person.skills || "[]")
                : (person.skills || []);
            } catch { personSkills = []; }

            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-3xl p-5 border border-gray-100/80 shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="p-[2px] rounded-[18px] bg-gradient-to-br from-violet-400 to-indigo-600">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-violet-600 font-bold text-lg overflow-hidden" style={{ background: person.avatar ? undefined : "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
                        {person.avatar ? (
                          <img src={person.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white">{person.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    {person.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-[2.5px] border-white rounded-full shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[15px]">{person.name}</h4>
                      {person.online && <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">Online</span>}
                    </div>
                    {(person.title || person.company) && (
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {person.title}{person.title && person.company ? " at " : ""}<span className="text-gray-700">{person.company}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {role && (
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-600 text-[10px] font-semibold rounded-lg border border-violet-100/60">
                          {role.icon} {role.label}
                        </span>
                      )}
                      {stage && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-lg border border-blue-100/60">
                          {stage.icon} {stage.label}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">{dist}</span>
                    </div>
                    {person.lookingFor && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-2 bg-emerald-50/60 inline-block px-2 py-0.5 rounded-md">
                        Looking for: {person.lookingFor}
                      </p>
                    )}
                    {personSkills.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2.5">
                        {personSkills.slice(0, 4).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-lg border border-gray-100">{s}</span>
                        ))}
                        {personSkills.length > 4 && (
                          <span className="text-[10px] text-gray-400 font-medium self-center">+{personSkills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2.5 mt-4 pt-4 border-t border-gray-100/80">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendHi(person.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-xs font-bold rounded-2xl shadow-md shadow-violet-200/50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                  >
                    <MessageCircle size={14} /> Say Hi
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      fetch("/api/connections", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fromUserId: user?.id, toUserId: person.id }),
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-violet-600 text-xs font-bold rounded-2xl border border-violet-200/80 hover:bg-violet-50 transition-colors"
                    style={{ background: "linear-gradient(135deg, #f5f3ff, #eef2ff)" }}
                  >
                    <UserPlus size={14} /> Connect
                  </motion.button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
