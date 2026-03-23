"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Minus, Plus, Calendar, Users, Sparkles, Megaphone, UsersRound, ChevronLeft, Clock, Type, AlignLeft } from "lucide-react";
import { useStore } from "@/store";
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from "@/lib/utils";

type CreateMode = "pick" | "activity" | "event" | "group";

export default function CreateActivity() {
  const { user, userLocation, setScreen, addActivity, setOpportunityType } = useStore();
  const [mode, setMode] = useState<CreateMode>("pick");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [playersNeeded, setPlayersNeeded] = useState(2);
  const [category, setCategory] = useState("social");
  const [isEvent, setIsEvent] = useState(false);
  const [ticketPrice, setTicketPrice] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  const pickMode = (m: CreateMode) => {
    setMode(m);
    if (m === "event") {
      setIsEvent(true);
      setCategory("event");
      setType("event");
    } else if (m === "group") {
      setCategory("social");
      setPlayersNeeded(10);
      setType("hangout");
      setIsRecurring(true);
    } else {
      setIsEvent(false);
    }
  };

  const publish = async () => {
    if (!user) { setError("Please log in first"); return; }
    if (!type) { setError("Please select an activity type"); return; }
    if (!title) { setError("Please enter a title"); return; }
    setPublishing(true);
    setError("");

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, title, description,
          lat: userLocation.lat + (Math.random() - 0.5) * 0.005,
          lng: userLocation.lng + (Math.random() - 0.5) * 0.005,
          time: new Date(`${date}T${time}`).toISOString(),
          playersNeeded, creatorId: user.id,
          category, isEvent, ticketPrice: parseFloat(ticketPrice) || 0,
          isFree: !ticketPrice || parseFloat(ticketPrice) === 0,
          eventUrl, isRecurring, recurrencePattern,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create. Please try again.");
        return;
      }
      addActivity(data);
      setScreen("map");
    } catch (e) {
      console.error("Publish error:", e);
      setError("Network error. Check your connection and try again.");
    } finally {
      setPublishing(false);
    }
  };

  const createOptions = [
    {
      id: "activity" as const,
      icon: Sparkles,
      label: "Activity",
      desc: "Sports, hangouts, meetups",
      gradient: "from-violet-500 to-purple-600",
      lightBg: "bg-violet-50",
    },
    {
      id: "event" as const,
      icon: Calendar,
      label: "Event",
      desc: "Workshops, parties, concerts",
      gradient: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50",
    },
    {
      id: "group" as const,
      icon: UsersRound,
      label: "Group",
      desc: "Clubs, communities, squads",
      gradient: "from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50",
    },
  ];

  const selectedDateTime = new Date(`${date}T${time}`);
  const isPastDate = selectedDateTime < new Date();
  const canPublish = type && title && user && !publishing && !isPastDate;
  const formTitle = mode === "event" ? "Create Event" : mode === "group" ? "Create Group" : "Create Activity";

  const inputCls = "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        {mode !== "pick" ? (
          <button onClick={() => setMode("pick")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button onClick={() => setScreen("map")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        )}
        <h3 className="flex-1 font-bold text-lg">{mode === "pick" ? "Create" : formTitle}</h3>
        {mode !== "pick" && (
          <button onClick={() => setScreen("map")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Picker Screen */}
      <AnimatePresence mode="wait">
        {mode === "pick" && (
          <motion.div
            key="pick"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <p className="text-sm text-gray-400 font-medium px-1 mb-1">What would you like to create?</p>

            {createOptions.map((opt, idx) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => pickMode(opt.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white border border-gray-100 hover:shadow-md transition-all text-left"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-[15px]">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <ChevronLeft size={18} className="text-gray-300 rotate-180" />
                </motion.button>
              );
            })}

            {/* Divider */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Opportunities</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Opportunity types */}
            {[
              { type: "gig" as const, icon: "💼", label: "Post a Gig", desc: "Freelance work or quick tasks" },
              { type: "trip" as const, icon: "✈️", label: "Plan a Trip", desc: "Find travel buddies" },
              { type: "skill" as const, icon: "🎓", label: "Teach / Learn", desc: "Skill exchange sessions" },
              { type: "idea" as const, icon: "💡", label: "Share an Idea", desc: "Get feedback, find co-founders" },
            ].map((opt, idx) => (
              <motion.button
                key={opt.type}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setOpportunityType(opt.type);
                  setScreen("create-opportunity");
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-sm transition-all text-left"
              >
                <span className="text-2xl w-10 text-center">{opt.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
                <ChevronLeft size={16} className="text-gray-300 rotate-180" />
              </motion.button>
            ))}

            <div className="h-4" />
          </motion.div>
        )}

        {/* Form Screen */}
        {mode !== "pick" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {/* Category (only for activity mode) */}
            {mode === "activity" && (
              <div className="bg-white rounded-3xl p-5 border border-gray-100">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Category</label>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <motion.button key={c.value} whileTap={{ scale: 0.95 }} onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${category === c.value ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-500 border-gray-200"}`}>
                      {c.icon} {c.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Type & Title Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {mode === "event" ? "Event Type" : mode === "group" ? "Group Type" : "Activity Type"}
                </label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className={`${inputCls} mt-2`}>
                  <option value="">Select type...</option>
                  {ACTIVITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {mode === "group" ? "Group Name" : "Title"}
                </label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    mode === "event" ? "e.g., Friday Night DJ Party" :
                    mode === "group" ? "e.g., Morning Runners Club" :
                    "e.g., Playing badminton at Central Park"
                  }
                  className={`${inputCls} mt-2`} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    mode === "group" ? "What is this group about? Who should join?" :
                    "Tell others what you're planning..."
                  }
                  rows={3}
                  className={`${inputCls} mt-2 resize-none`} />
              </div>
            </div>

            {/* Date, Time & Players Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Calendar size={10} /> {mode === "group" ? "Start Date" : "Date"}
                  </label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className={`${inputCls} mt-2`} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <Clock size={10} /> Time
                  </label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className={`${inputCls} mt-2`} />
                </div>
              </div>

              {isPastDate && (
                <p className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-xl">Date/time is in the past — please select a future time</p>
              )}

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Users size={10} /> {mode === "group" ? "Max Members" : mode === "event" ? "Capacity" : "Players Needed"}
                </label>
                <div className="flex items-center gap-5 mt-3">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPlayersNeeded(Math.max(1, playersNeeded - 1))}
                    className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-violet-600 hover:border-violet-300 transition-colors">
                    <Minus size={18} />
                  </motion.button>
                  <span className="text-2xl font-bold min-w-[30px] text-center">{playersNeeded}</span>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPlayersNeeded(Math.min(100, playersNeeded + 1))}
                    className="w-11 h-11 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-violet-600 hover:border-violet-300 transition-colors">
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Event-specific fields */}
            {mode === "event" && (
              <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
                <h4 className="font-bold text-sm flex items-center gap-2 text-amber-700">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Megaphone size={16} className="text-amber-500" />
                  </div>
                  Event Details
                </h4>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ticket Price (INR, 0 = free)</label>
                  <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="0"
                    className={`${inputCls} mt-2`} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Event URL (optional)</label>
                  <input value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} placeholder="https://..."
                    className={`${inputCls} mt-2`} />
                </div>
              </div>
            )}

            {/* Group-specific: always recurring */}
            {mode === "group" && (
              <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-700">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <UsersRound size={16} className="text-emerald-500" />
                  </div>
                  Group Schedule
                </h4>
                <p className="text-xs text-gray-400">How often does this group meet?</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["daily", "weekly", "weekends", "monthly"].map((p) => (
                    <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => { setRecurrencePattern(p); setIsRecurring(true); }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${recurrencePattern === p ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200"}`}>
                      {p}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring toggle for activity mode */}
            {mode === "activity" && (
              <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsRecurring(!isRecurring)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${isRecurring ? "bg-violet-600" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isRecurring ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm font-semibold text-gray-600">Recurring Activity</span>
                </div>

                <AnimatePresence>
                  {isRecurring && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {["daily", "weekly", "weekends", "monthly"].map((p) => (
                          <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => setRecurrencePattern(p)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${recurrencePattern === p ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-500 border-gray-200"}`}>
                            {p}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Location</label>
              <div className="flex items-center gap-3 mt-2 p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                  <MapPin size={16} className="text-red-500" />
                </div>
                <span className="text-sm text-gray-600">
                  {userLocation.lat !== 0 || userLocation.lng !== 0
                    ? `Using your location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
                    : "Location not available — enable GPS"}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Create Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={publish}
              disabled={!canPublish}
              className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all ${
                canPublish
                  ? mode === "event"
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50"
                    : mode === "group"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50"
                    : "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-200/50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {publishing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </span>
              ) : (
                mode === "event" ? "Create Event" :
                mode === "group" ? "Create Group" :
                "Create Activity"
              )}
            </motion.button>

            <div className="h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
