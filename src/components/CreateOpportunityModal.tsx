"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Briefcase, GraduationCap, Plane, Lightbulb, MapPin, ChevronLeft } from "lucide-react";
import { useStore } from "@/store";
import { TRIP_TYPES, IDEA_CATEGORIES, IDEA_STAGES, PROFESSIONAL_SKILLS } from "@/lib/utils";

const TABS = [
  { value: "gig" as const, label: "Gig", icon: Briefcase, color: "#00B894", gradient: "from-emerald-500 to-green-600" },
  { value: "trip" as const, label: "Trip", icon: Plane, color: "#00CED1", gradient: "from-cyan-500 to-teal-600" },
  { value: "skill" as const, label: "Skill", icon: GraduationCap, color: "#0984E3", gradient: "from-blue-500 to-indigo-600" },
  { value: "idea" as const, label: "Idea", icon: Lightbulb, color: "#F59E0B", gradient: "from-amber-500 to-orange-600" },
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

  const activeTab = TABS.find(t => t.value === opportunityType) || TABS[0];
  const inputCls = "w-full px-4 py-3 bg-[#f4f4f8] border border-transparent rounded-xl text-[14px] outline-none focus:bg-white focus:border-[#a29bfe] focus:shadow-[0_0_0_3px_rgba(108,92,231,0.12)] transition-all placeholder:text-[#9e9eb0]";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[68px] bg-[#f8f8fa] z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="header-glass flex items-center gap-3 px-5 py-3">
        <button onClick={() => setScreen("create")} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f8] hover:bg-[#e8e8ef] transition-colors">
          <ChevronLeft size={16} className="text-[#4a4a5e]" />
        </button>
        <h3 className="flex-1 font-bold text-[16px] text-[#1a1a2e]">Create Opportunity</h3>
        <button onClick={() => setScreen("map")} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f8] hover:bg-[#e8e8ef] transition-colors">
          <X size={14} className="text-[#9e9eb0]" />
        </button>
      </div>

      {/* Tab selector */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-black/[0.03]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = opportunityType === tab.value;
            return (
              <motion.button
                key={tab.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpportunityType(tab.value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                  active ? "text-white shadow-md" : "text-gray-400"
                }`}
                style={active ? { background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)` } : {}}
              >
                <Icon size={17} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {opportunityType === "gig" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Gig Title</label>
                <input value={gigTitle} onChange={(e) => setGigTitle(e.target.value)} placeholder="e.g., Need photographer today" className={`${inputCls} mt-2`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Description</label>
                <textarea value={gigDesc} onChange={(e) => setGigDesc(e.target.value)} placeholder="What do you need?" rows={3} className={`${inputCls} mt-2 resize-none`} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Budget (INR)</label>
                  <input type="number" value={gigBudget} onChange={(e) => setGigBudget(e.target.value)} placeholder="0" className={`${inputCls} mt-2`} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Deadline</label>
                  <input type="date" value={gigDeadline} onChange={(e) => setGigDeadline(e.target.value)} className={`${inputCls} mt-2`} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Required Skills</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PROFESSIONAL_SKILLS.map((s) => (
                    <motion.button
                      key={s}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setGigSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        gigSkills.includes(s) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >{s}</motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {opportunityType === "trip" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Destination</label>
                <input value={tripDest} onChange={(e) => setTripDest(e.target.value)} placeholder="e.g., Goa" className={`${inputCls} mt-2`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Description</label>
                <textarea value={tripDesc} onChange={(e) => setTripDesc(e.target.value)} placeholder="What's the plan?" rows={2} className={`${inputCls} mt-2 resize-none`} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Trip Type</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TRIP_TYPES.map((t) => (
                    <motion.button
                      key={t.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTripType(t.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        tripType === t.value ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >{t.icon} {t.label}</motion.button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Start Date</label>
                  <input type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} className={`${inputCls} mt-2`} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">End Date</label>
                  <input type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} className={`${inputCls} mt-2`} />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Budget</label>
                  <input value={tripBudget} onChange={(e) => setTripBudget(e.target.value)} placeholder="e.g., 5000-10000" className={`${inputCls} mt-2`} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Max Buddies</label>
                  <input type="number" value={tripMax} onChange={(e) => setTripMax(parseInt(e.target.value) || 4)} min={1} max={20} className={`${inputCls} mt-2`} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {opportunityType === "skill" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Skill Name</label>
                <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g., Learn React" className={`${inputCls} mt-2`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Description</label>
                <textarea value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} placeholder="What will you teach/learn?" rows={2} className={`${inputCls} mt-2 resize-none`} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">I want to</label>
                <div className="flex gap-2 mt-2">
                  {["teaching", "learning"].map((t) => (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSkillType(t)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all border ${
                        skillType === t ? "bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-200" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >{t === "teaching" ? "Teach" : "Learn"}</motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Pricing</label>
                <div className="flex gap-2 mt-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSkillFree(true)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all border ${skillFree ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200" : "bg-white text-gray-500 border-gray-200"}`}
                  >Free</motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSkillFree(false)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all border ${!skillFree ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200" : "bg-white text-gray-500 border-gray-200"}`}
                  >Paid</motion.button>
                </div>
                <AnimatePresence>
                  {!skillFree && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <input type="number" value={skillPrice} onChange={(e) => setSkillPrice(e.target.value)} placeholder="Price (INR)" className={`${inputCls} mt-3`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Schedule</label>
                <input value={skillSchedule} onChange={(e) => setSkillSchedule(e.target.value)} placeholder="e.g., Weekends 10AM" className={`${inputCls} mt-2`} />
              </div>
            </div>
          </motion.div>
        )}

        {opportunityType === "idea" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Idea Title</label>
                <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="e.g., AI-powered recipe app" className={`${inputCls} mt-2`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Description</label>
                <textarea value={ideaDesc} onChange={(e) => setIdeaDesc(e.target.value)} placeholder="Describe your idea..." rows={3} className={`${inputCls} mt-2 resize-none`} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-black/[0.03] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {IDEA_CATEGORIES.map((c) => (
                    <motion.button
                      key={c.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIdeaCategory(c.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        ideaCategory === c.value ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >{c.icon} {c.label}</motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Stage</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {IDEA_STAGES.map((s) => (
                    <motion.button
                      key={s.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIdeaStage(s.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        ideaStage === s.value ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-500 border-gray-200"
                      }`}
                    >{s.label}</motion.button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#9e9eb0] uppercase tracking-wider">Looking For</label>
                <input value={ideaLookingFor} onChange={(e) => setIdeaLookingFor(e.target.value)} placeholder="e.g., Co-founder, Developer" className={`${inputCls} mt-2`} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Location info */}
        <div className="bg-white rounded-2xl p-4 border border-black/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <MapPin size={16} className="text-red-500" />
            </div>
            <span className="text-sm text-gray-500">
              {userLocation.lat !== 0 || userLocation.lng !== 0
                ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : "Location not available"}
            </span>
          </div>
        </div>

        {/* Publish Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={!canPublish() || publishing}
          className={`w-full py-4 rounded-2xl font-bold text-[15px] transition-all ${
            canPublish() && !publishing
              ? `bg-gradient-to-r ${activeTab.gradient} text-white shadow-lg`
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {publishing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Publishing...
            </span>
          ) : (
            "Publish"
          )}
        </motion.button>

        <div className="h-4" />
      </div>
    </motion.div>
  );
}
