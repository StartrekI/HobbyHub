"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Minus, Plus, Calendar, Users, Sparkles, Megaphone, UsersRound, ChevronLeft } from "lucide-react";
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

  const pickMode = (m: CreateMode) => {
    setMode(m);
    if (m === "event") {
      setIsEvent(true);
      setCategory("event");
    } else if (m === "group") {
      setCategory("social");
      setPlayersNeeded(10);
    } else {
      setIsEvent(false);
    }
  };

  const [error, setError] = useState("");

  const publish = async () => {
    if (!type || !title || !user) return;
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
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
    },
    {
      id: "event" as const,
      icon: Calendar,
      label: "Event",
      desc: "Workshops, parties, concerts",
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      id: "group" as const,
      icon: UsersRound,
      label: "Group",
      desc: "Clubs, communities, squads",
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
  ];

  const canPublish = type && title && user && !publishing;
  const formTitle = mode === "event" ? "Create Event" : mode === "group" ? "Create Group" : "Create Activity";

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
        {mode !== "pick" ? (
          <button onClick={() => setMode("pick")}><ChevronLeft size={20} /></button>
        ) : (
          <button onClick={() => setScreen("map")}><X size={20} /></button>
        )}
        <h3 className="flex-1 font-bold text-lg">{mode === "pick" ? "What do you want to create?" : formTitle}</h3>
        {mode !== "pick" && (
          <button onClick={() => setScreen("map")}><X size={18} className="text-gray-400" /></button>
        )}
      </div>

      {/* Picker Screen */}
      {mode === "pick" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {createOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => pickMode(opt.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${opt.border} ${opt.bg} hover:scale-[1.02] transition-all text-left`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center shadow-lg`}>
                  <Icon size={26} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
              </button>
            );
          })}

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">More options</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Opportunity types */}
          {[
            { type: "gig" as const, icon: "💼", label: "Post a Gig", desc: "Freelance work or quick tasks", color: "bg-green-50 border-green-200" },
            { type: "trip" as const, icon: "✈️", label: "Plan a Trip", desc: "Find travel buddies", color: "bg-cyan-50 border-cyan-200" },
            { type: "skill" as const, icon: "🎓", label: "Teach / Learn a Skill", desc: "Skill exchange sessions", color: "bg-blue-50 border-blue-200" },
            { type: "idea" as const, icon: "💡", label: "Share an Idea", desc: "Get feedback, find co-founders", color: "bg-yellow-50 border-yellow-200" },
          ].map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setOpportunityType(opt.type);
                setScreen("create-opportunity");
              }}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 ${opt.color} hover:scale-[1.02] transition-all text-left`}
            >
              <span className="text-2xl w-10 text-center">{opt.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Form Screen */}
      {mode !== "pick" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Category (only for activity mode) */}
          {mode === "activity" && (
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-2">Category</label>
              <div className="flex gap-2 flex-wrap">
                {ACTIVITY_CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setCategory(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${category === c.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">
              {mode === "event" ? "Event Type" : mode === "group" ? "Group Type" : "Activity Type"}
            </label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:border-violet-600 outline-none transition-colors">
              <option value="">Select type...</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">
              {mode === "group" ? "Group Name" : "Title"}
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === "event" ? "e.g., Friday Night DJ Party" :
                mode === "group" ? "e.g., Morning Runners Club" :
                "e.g., Playing badminton at Central Park"
              }
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === "group" ? "What is this group about? Who should join?" :
                "Tell others what you're planning..."
              }
              rows={3}
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-violet-600 outline-none transition-colors" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-500 mb-2">
                {mode === "group" ? "Start Date" : "Date"}
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none transition-colors" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">
              {mode === "group" ? "Max Members" : mode === "event" ? "Capacity" : "Players Needed"}
            </label>
            <div className="flex items-center gap-5">
              <button onClick={() => setPlayersNeeded(Math.max(1, playersNeeded - 1))}
                className="w-11 h-11 border-2 border-gray-200 rounded-full flex items-center justify-center text-violet-600 hover:border-violet-600 transition-colors">
                <Minus size={18} />
              </button>
              <span className="text-2xl font-bold min-w-[30px] text-center">{playersNeeded}</span>
              <button onClick={() => setPlayersNeeded(Math.min(100, playersNeeded + 1))}
                className="w-11 h-11 border-2 border-gray-200 rounded-full flex items-center justify-center text-violet-600 hover:border-violet-600 transition-colors">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Event-specific fields */}
          {mode === "event" && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                <Megaphone size={16} /> Event Details
              </h4>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Ticket Price (INR, 0 = free)</label>
                <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="0"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none bg-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Event URL (optional)</label>
                <input value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} placeholder="https://..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none bg-white" />
              </div>
            </div>
          )}

          {/* Group-specific: always recurring */}
          {mode === "group" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <h4 className="font-semibold text-emerald-800 text-sm flex items-center gap-2">
                <UsersRound size={16} /> Group Schedule
              </h4>
              <p className="text-xs text-gray-500">How often does this group meet?</p>
              <div className="flex gap-2 flex-wrap">
                {["daily", "weekly", "weekends", "monthly"].map((p) => (
                  <button key={p} onClick={() => { setRecurrencePattern(p); setIsRecurring(true); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${recurrencePattern === p ? "bg-emerald-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurring toggle for activity mode */}
          {mode === "activity" && (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${isRecurring ? "bg-violet-600" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isRecurring ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm font-semibold text-gray-600">Recurring Activity</span>
              </div>

              {isRecurring && (
                <div className="pl-2 border-l-2 border-violet-200">
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Recurrence</label>
                  <div className="flex gap-2">
                    {["daily", "weekly", "weekends", "monthly"].map((p) => (
                      <button key={p} onClick={() => setRecurrencePattern(p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${recurrencePattern === p ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">Location</label>
            <div className="flex items-center gap-2 p-3.5 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-violet-600 transition-colors">
              <MapPin size={18} className="text-red-500" />
              <span className="text-sm text-gray-600">Use current location</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Big Create Button */}
          <button
            onClick={publish}
            disabled={!canPublish}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${
              canPublish
                ? mode === "event"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:scale-[1.02] shadow-amber-200"
                  : mode === "group"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-[1.02] shadow-emerald-200"
                  : "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:scale-[1.02] shadow-violet-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {publishing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing...
              </span>
            ) : (
              mode === "event" ? "🎉 Create Event" :
              mode === "group" ? "👥 Create Group" :
              "🚀 Create Activity"
            )}
          </button>

          <div className="h-4" />
        </div>
      )}
    </motion.div>
  );
}
