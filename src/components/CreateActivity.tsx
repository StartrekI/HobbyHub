"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Minus, Plus } from "lucide-react";
import { useStore } from "@/store";
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from "@/lib/utils";

export default function CreateActivity() {
  const { user, userLocation, setScreen, addActivity } = useStore();
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

  const publish = async () => {
    if (!type || !title || !user) return;
    setPublishing(true);

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
      const activity = await res.json();
      addActivity(activity);
      setScreen("map");
    } catch (e) {
      console.error("Publish error:", e);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <button onClick={() => setScreen("map")}><X size={20} /></button>
        <h3 className="flex-1 font-bold text-lg">Create Activity</h3>
        <button onClick={publish} disabled={!type || !title || publishing}
          className="text-violet-600 font-semibold text-sm disabled:opacity-50">
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Category */}
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

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-2">Activity Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm bg-white focus:border-violet-600 outline-none transition-colors">
            <option value="">Select type...</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-2">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Playing badminton at Central Park"
            className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-2">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell others what you're planning..." rows={3}
            className="w-full p-3.5 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-violet-600 outline-none transition-colors" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-500 mb-2">Date</label>
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
          <label className="block text-sm font-semibold text-gray-500 mb-2">Players Needed</label>
          <div className="flex items-center gap-5">
            <button onClick={() => setPlayersNeeded(Math.max(1, playersNeeded - 1))}
              className="w-11 h-11 border-2 border-gray-200 rounded-full flex items-center justify-center text-violet-600 hover:border-violet-600 transition-colors">
              <Minus size={18} />
            </button>
            <span className="text-2xl font-bold min-w-[30px] text-center">{playersNeeded}</span>
            <button onClick={() => setPlayersNeeded(Math.min(50, playersNeeded + 1))}
              className="w-11 h-11 border-2 border-gray-200 rounded-full flex items-center justify-center text-violet-600 hover:border-violet-600 transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Event toggle */}
        <div className="flex items-center gap-3">
          <button onClick={() => setIsEvent(!isEvent)}
            className={`w-12 h-7 rounded-full transition-colors relative ${isEvent ? "bg-violet-600" : "bg-gray-200"}`}>
            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isEvent ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className="text-sm font-semibold text-gray-600">This is an Event</span>
        </div>

        {isEvent && (
          <div className="space-y-3 pl-2 border-l-2 border-violet-200">
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Ticket Price (INR, 0 = free)</label>
              <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} placeholder="0"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Event URL (optional)</label>
              <input value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} placeholder="https://..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
            </div>
          </div>
        )}

        {/* Recurring toggle */}
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

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-2">Location</label>
          <div className="flex items-center gap-2 p-3.5 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-violet-600 transition-colors">
            <MapPin size={18} className="text-red-500" />
            <span className="text-sm text-gray-600">Use current location</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
