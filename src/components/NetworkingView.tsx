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
  const locationRef = useRef(userLocation);
  locationRef.current = userLocation;

  const fetchPeople = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const { lat, lng } = locationRef.current;
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      userId: user.id,
    });
    if (roleFilter) params.set("role", roleFilter);
    if (stageFilter) params.set("stage", stageFilter);
    if (lookingForFilter) params.set("lookingFor", lookingForFilter);

    fetch(`/api/networking?${params}`)
      .then((r) => r.json())
      .then((data) => { setPeople(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, roleFilter, stageFilter, lookingForFilter]);

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
      className="h-full bg-[#f8f8fa] flex flex-col"
    >
      {/* ── Header ── */}
      <div className="header-glass px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setScreen("map")} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f8] hover:bg-[#e8e8ef] transition-colors">
            <ArrowLeft size={16} className="text-[#4a4a5e]" />
          </button>
          <h3 className="flex-1 font-bold text-xl text-[#1a1a2e] tracking-tight">Networking</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showFilters ? "bg-[#e8e5ff] text-[#6c5ce7]" : "bg-[#f4f4f8] text-[#9e9eb0]"}`}
          >
            <Filter size={16} />
            {activeFilters > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#6c5ce7] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>
            )}
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9e9eb0]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people, roles, companies..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f4f4f8] rounded-xl text-[13px] outline-none border border-transparent focus:bg-white focus:border-[#a29bfe] focus:shadow-[0_0_0_3px_rgba(108,92,231,0.12)] transition-all placeholder:text-[#9e9eb0]"
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
              <FilterSection label="Role" options={[{ value: "", label: "All" }, ...USER_ROLES.map(r => ({ value: r.value, label: `${r.icon} ${r.label}` }))]} selected={roleFilter} onSelect={setRoleFilter} />
              <FilterSection label="Stage" options={[{ value: "", label: "All" }, ...STARTUP_STAGES.map(s => ({ value: s.value, label: `${s.icon} ${s.label}` }))]} selected={stageFilter} onSelect={setStageFilter} />
              <FilterSection label="Looking For" options={[{ value: "", label: "All" }, ...LOOKING_FOR_OPTIONS.map(l => ({ value: l.value, label: l.label }))]} selected={lookingForFilter} onSelect={setLookingForFilter} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── People list ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#e8e8ef] border-t-[#6c5ce7] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 bg-[#f4f4f8] rounded-2xl flex items-center justify-center mb-4">
              <Briefcase size={26} className="text-[#d1d1db]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1a1a2e]">No professionals nearby</p>
            <p className="text-[12px] text-[#9e9eb0] mt-1">Try expanding your filters</p>
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-2xl p-4 border border-black/[0.03] hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {person.avatar ? (
                        <img src={person.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{person.name.charAt(0)}</span>
                      )}
                    </div>
                    {person.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00b894] border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-[14px] text-[#1a1a2e]">{person.name}</h4>
                      {person.online && <span className="text-[10px] text-[#00b894] font-semibold bg-[#e6f9f4] px-1.5 py-0.5 rounded-md">Online</span>}
                    </div>
                    {(person.title || person.company) && (
                      <p className="text-[12px] text-[#9e9eb0] mt-0.5">
                        {person.title}{person.title && person.company ? " at " : ""}<span className="text-[#6e6e82]">{person.company}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {role && (
                        <span className="px-2 py-0.5 bg-[#e8e5ff] text-[#6c5ce7] text-[10px] font-semibold rounded-md">
                          {role.icon} {role.label}
                        </span>
                      )}
                      {stage && (
                        <span className="px-2 py-0.5 bg-[#e8f4ff] text-[#74b9ff] text-[10px] font-semibold rounded-md">
                          {stage.icon} {stage.label}
                        </span>
                      )}
                      <span className="badge">{dist}</span>
                    </div>
                    {person.lookingFor && (
                      <p className="text-[11px] text-[#00b894] font-semibold mt-2 bg-[#e6f9f4] inline-block px-2 py-0.5 rounded-md">
                        Looking for: {person.lookingFor}
                      </p>
                    )}
                    {personSkills.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {personSkills.slice(0, 4).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-[#f4f4f8] text-[#6e6e82] text-[10px] font-medium rounded-md">{s}</span>
                        ))}
                        {personSkills.length > 4 && (
                          <span className="text-[10px] text-[#9e9eb0] font-medium self-center">+{personSkills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3.5 pt-3.5 border-t border-black/[0.04]">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => sendHi(person.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6c5ce7] text-white text-[12px] font-semibold rounded-xl shadow-[0_4px_12px_rgba(108,92,231,0.3)]"
                  >
                    <MessageCircle size={13} /> Say Hi
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
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[#6c5ce7] text-[12px] font-semibold rounded-xl border border-[#6c5ce7]/20 bg-[#e8e5ff]/50 hover:bg-[#e8e5ff] transition-colors"
                  >
                    <UserPlus size={13} /> Connect
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

function FilterSection({ label, options, selected, onSelect }: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">{label}</label>
      <div className="flex gap-1.5 flex-wrap mt-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 border ${
              selected === opt.value
                ? "bg-[#6c5ce7] text-white border-[#6c5ce7]"
                : "bg-white text-[#6e6e82] border-black/[0.04] hover:border-[#6c5ce7]/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
