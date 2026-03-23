"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Briefcase, GraduationCap, Plane, Lightbulb } from "lucide-react";
import { useStore } from "@/store";
import { TRIP_TYPES, IDEA_CATEGORIES, IDEA_STAGES, PROFESSIONAL_SKILLS } from "@/lib/utils";

const TABS = [
  { value: "gig" as const, label: "Gig", icon: Briefcase, color: "#00B894" },
  { value: "trip" as const, label: "Trip", icon: Plane, color: "#00CED1" },
  { value: "skill" as const, label: "Skill", icon: GraduationCap, color: "#0984E3" },
  { value: "idea" as const, label: "Idea", icon: Lightbulb, color: "#FDCB6E" },
];

export default function CreateOpportunityModal() {
  const { user, userLocation, setScreen, opportunityType, setOpportunityType } = useStore();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // Gig fields
  const [gigTitle, setGigTitle] = useState("");
  const [gigDesc, setGigDesc] = useState("");
  const [gigBudget, setGigBudget] = useState("");
  const [gigDeadline, setGigDeadline] = useState("");
  const [gigSkills, setGigSkills] = useState<string[]>([]);

  // Trip fields
  const [tripDest, setTripDest] = useState("");
  const [tripDesc, setTripDesc] = useState("");
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [tripType, setTripType] = useState("adventure");
  const [tripBudget, setTripBudget] = useState("");
  const [tripMax, setTripMax] = useState(4);

  // Skill fields
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillType, setSkillType] = useState("teaching");
  const [skillFree, setSkillFree] = useState(true);
  const [skillPrice, setSkillPrice] = useState("");
  const [skillSchedule, setSkillSchedule] = useState("");

  // Idea fields
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaCategory, setIdeaCategory] = useState("general");
  const [ideaStage, setIdeaStage] = useState("concept");
  const [ideaLookingFor, setIdeaLookingFor] = useState("");

  const publish = async () => {
    if (!user) return;
    setPublishing(true);
    setError("");

    try {
      let res: Response | undefined;
      if (opportunityType === "gig") {
        res = await fetch("/api/gigs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: gigTitle, description: gigDesc, budget: parseFloat(gigBudget) || 0,
            skills: gigSkills, deadline: gigDeadline, lat: userLocation.lat, lng: userLocation.lng, creatorId: user.id,
          }),
        });
      } else if (opportunityType === "trip") {
        res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: tripDest, description: tripDesc, startDate: tripStart, endDate: tripEnd,
            tripType, budget: tripBudget, maxBuddies: tripMax, lat: userLocation.lat, lng: userLocation.lng, creatorId: user.id,
          }),
        });
      } else if (opportunityType === "skill") {
        res = await fetch("/api/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skill: skillName, description: skillDesc, sessionType: skillType,
            isFree: skillFree, price: parseFloat(skillPrice) || 0, schedule: skillSchedule,
            lat: userLocation.lat, lng: userLocation.lng, teacherId: user.id,
          }),
        });
      } else if (opportunityType === "idea") {
        res = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: ideaTitle, description: ideaDesc, category: ideaCategory,
            stage: ideaStage, lookingFor: ideaLookingFor, lat: userLocation.lat, lng: userLocation.lng, creatorId: user.id,
          }),
        });
      }
      if (res && !res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to publish. Please try again.");
        return;
      }
      setScreen("discover");
    } catch (e) {
      console.error("Publish error:", e);
      setError("Network error. Please check your connection.");
    } finally {
      setPublishing(false);
    }
  };

  const canPublish = () => {
    if (opportunityType === "gig") return !!gigTitle;
    if (opportunityType === "trip") return !!tripDest;
    if (opportunityType === "skill") return !!skillName;
    if (opportunityType === "idea") return !!ideaTitle;
    return false;
  };

  const inputCls = "w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none transition-colors";

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
        <button onClick={() => setScreen("map")}><X size={20} /></button>
        <h3 className="flex-1 font-bold text-lg">Create Opportunity</h3>
        <button
          onClick={publish}
          disabled={!canPublish() || publishing}
          className="text-violet-600 font-semibold text-sm disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 p-4 pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = opportunityType === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setOpportunityType(tab.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all ${
                active ? "text-white shadow-lg" : "bg-gray-100 text-gray-500"
              }`}
              style={active ? { background: tab.color } : {}}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {opportunityType === "gig" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Gig Title</label>
              <input value={gigTitle} onChange={(e) => setGigTitle(e.target.value)} placeholder="e.g., Need photographer today" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Description</label>
              <textarea value={gigDesc} onChange={(e) => setGigDesc(e.target.value)} placeholder="What do you need?" rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Budget (INR)</label>
                <input type="number" value={gigBudget} onChange={(e) => setGigBudget(e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Deadline</label>
                <input type="date" value={gigDeadline} onChange={(e) => setGigDeadline(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Required Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {PROFESSIONAL_SKILLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setGigSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      gigSkills.includes(s) ? "bg-emerald-500 text-white font-semibold" : "bg-gray-100 text-gray-500"
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {opportunityType === "trip" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Destination</label>
              <input value={tripDest} onChange={(e) => setTripDest(e.target.value)} placeholder="e.g., Goa" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Description</label>
              <textarea value={tripDesc} onChange={(e) => setTripDesc(e.target.value)} placeholder="What's the plan?" rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Trip Type</label>
              <div className="flex flex-wrap gap-1.5">
                {TRIP_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTripType(t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      tripType === t.value ? "bg-cyan-500 text-white font-semibold" : "bg-gray-100 text-gray-500"
                    }`}
                  >{t.icon} {t.label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Start Date</label>
                <input type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-1">End Date</label>
                <input type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Budget</label>
                <input value={tripBudget} onChange={(e) => setTripBudget(e.target.value)} placeholder="e.g., 5000-10000" className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Max Buddies</label>
                <input type="number" value={tripMax} onChange={(e) => setTripMax(parseInt(e.target.value) || 4)} min={1} max={20} className={inputCls} />
              </div>
            </div>
          </>
        )}

        {opportunityType === "skill" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Skill Name</label>
              <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g., Learn React" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Description</label>
              <textarea value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} placeholder="What will you teach/learn?" rows={2} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">I want to</label>
              <div className="flex gap-2">
                {["teaching", "learning"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSkillType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      skillType === t ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >{t === "teaching" ? "Teach" : "Learn"}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Pricing</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setSkillFree(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${skillFree ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}
                >Free</button>
                <button
                  onClick={() => setSkillFree(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!skillFree ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}
                >Paid</button>
              </div>
              {!skillFree && (
                <input type="number" value={skillPrice} onChange={(e) => setSkillPrice(e.target.value)} placeholder="Price (INR)" className={inputCls} />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Schedule</label>
              <input value={skillSchedule} onChange={(e) => setSkillSchedule(e.target.value)} placeholder="e.g., Weekends 10AM" className={inputCls} />
            </div>
          </>
        )}

        {opportunityType === "idea" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Idea Title</label>
              <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="e.g., AI-powered recipe app" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Description</label>
              <textarea value={ideaDesc} onChange={(e) => setIdeaDesc(e.target.value)} placeholder="Describe your idea..." rows={3} className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {IDEA_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setIdeaCategory(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      ideaCategory === c.value ? "bg-amber-500 text-white font-semibold" : "bg-gray-100 text-gray-500"
                    }`}
                  >{c.icon} {c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {IDEA_STAGES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setIdeaStage(s.value)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      ideaStage === s.value ? "bg-amber-500 text-white font-semibold" : "bg-gray-100 text-gray-500"
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Looking For</label>
              <input value={ideaLookingFor} onChange={(e) => setIdeaLookingFor(e.target.value)} placeholder="e.g., Co-founder, Developer" className={inputCls} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
