"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Filter, MessageCircle, UserPlus, Briefcase } from "lucide-react";
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

  useEffect(() => {
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

  const filtered = search
    ? people.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase())
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

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setScreen("map")}><ArrowLeft size={20} /></button>
          <h3 className="flex-1 font-bold text-lg">Networking</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? "bg-violet-100 text-violet-600" : "text-gray-400"}`}
          >
            <Filter size={18} />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, roles, companies..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-200 transition-all"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="mt-3 space-y-2 overflow-hidden">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Role</label>
              <div className="flex gap-1.5 flex-wrap mt-1">
                <button
                  onClick={() => setRoleFilter("")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${!roleFilter ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}
                >All</button>
                {USER_ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRoleFilter(r.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleFilter === r.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}
                  >{r.icon} {r.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Startup Stage</label>
              <div className="flex gap-1.5 flex-wrap mt-1">
                <button
                  onClick={() => setStageFilter("")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${!stageFilter ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}
                >All</button>
                {STARTUP_STAGES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStageFilter(s.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${stageFilter === s.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}
                  >{s.icon} {s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Looking For</label>
              <div className="flex gap-1.5 flex-wrap mt-1">
                <button
                  onClick={() => setLookingForFilter("")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${!lookingForFilter ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}
                >All</button>
                {LOOKING_FOR_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLookingForFilter(l.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${lookingForFilter === l.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}
                  >{l.label}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* People list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">Finding people nearby...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Briefcase size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">No professionals found nearby</p>
            <p className="text-xs mt-1">Try expanding your filters</p>
          </div>
        ) : (
          filtered.map((person, idx) => {
            const dist = getDistance(userLocation.lat, userLocation.lng, person.lat, person.lng);
            const role = roleInfo(person.role);
            const stage = stageInfo(person.startupStage);
            const personSkills: string[] = typeof person.skills === "string"
              ? JSON.parse(person.skills || "[]")
              : (person.skills || []);

            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-400 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                      {person.avatar ? (
                        <img src={person.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        person.name.charAt(0)
                      )}
                    </div>
                    {person.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">{person.name}</h4>
                      {person.online && <span className="text-[10px] text-emerald-500 font-semibold">Online</span>}
                    </div>
                    {(person.title || person.company) && (
                      <p className="text-xs text-gray-500">
                        {person.title}{person.title && person.company ? " at " : ""}{person.company}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {role && (
                        <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-semibold rounded-full">
                          {role.icon} {role.label}
                        </span>
                      )}
                      {stage && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full">
                          {stage.icon} {stage.label}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{dist}</span>
                    </div>
                    {person.lookingFor && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Looking for: {person.lookingFor}
                      </p>
                    )}
                    {personSkills.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1.5">
                        {personSkills.slice(0, 4).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">{s}</span>
                        ))}
                        {personSkills.length > 4 && (
                          <span className="text-[10px] text-gray-400">+{personSkills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => sendHi(person.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                  >
                    <MessageCircle size={14} /> Say Hi
                  </button>
                  <button
                    onClick={() => {
                      fetch("/api/connections", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fromUserId: user?.id, toUserId: person.id }),
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <UserPlus size={14} /> Connect
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
