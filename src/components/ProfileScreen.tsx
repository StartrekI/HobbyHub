"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Star, Camera, Check, X, Shield, GraduationCap, Users,
  LogOut, ChevronRight, Edit3, MapPin, Zap, Trophy, Target,
  Clock, TrendingUp, Share2, Copy, CheckCircle2,
} from "lucide-react";
import { useStore } from "@/store";
import { INTERESTS, TYPE_COLORS, ACTIVITY_TYPES, USER_ROLES, STARTUP_STAGES, PROFESSIONAL_SKILLS } from "@/lib/utils";

interface UserProfile {
  activitiesCreated: { id: string; title: string; type: string }[];
  participants: { activity: { id: string; title: string; type: string; creator: { name: string } } }[];
}
interface ProfileReq {
  id: string;
  status: string;
  requester: { id: string; name: string; avatar?: string };
}

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const AVAILABILITY_OPTIONS = [
  { value: "open", label: "Open to connect", color: "#00B894", bg: "bg-emerald-50", text: "text-emerald-600" },
  { value: "busy", label: "Busy right now", color: "#E17055", bg: "bg-red-50", text: "text-red-500" },
  { value: "looking", label: "Looking for team", color: "#6C5CE7", bg: "bg-violet-50", text: "text-violet-600" },
];

function ProfileCompletion({ user, profile, connections }: {
  user: import("@/types").UserType | null;
  profile: UserProfile | null;
  connections: { partner: { name: string } }[];
}) {
  if (!user) return null;
  const interests = Array.isArray(user.interests) ? user.interests : [];
  const skills = Array.isArray(user.skills) ? user.skills : [];

  const checks = [
    { label: "Name set", done: !!user.name },
    { label: "Bio added", done: !!user.bio },
    { label: "Avatar uploaded", done: !!user.avatar },
    { label: "3+ interests", done: interests.length >= 3 },
    { label: "Skills added", done: skills.length > 0 },
    { label: "Role set", done: !!user.role },
    { label: "First connection", done: connections.length > 0 },
    { label: "Joined an activity", done: (profile?.participants?.length || 0) > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="bg-white rounded-2xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h4 className="font-bold text-[13px] text-gray-900">Complete your profile</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Get discovered by more people</p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center">
          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#f5f5f7" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="14" fill="none" stroke="#111" strokeWidth="3"
              strokeDasharray={`${pct * 0.879} 100`}
              initial={{ strokeDasharray: "0 100" }}
              animate={{ strokeDasharray: `${pct * 0.879} 100` }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-gray-900">{pct}%</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.filter((c) => !c.done).slice(0, 4).map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 px-2 py-1 bg-[#f5f5f7] rounded-lg">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
            <span className="text-[10px] text-gray-500 font-medium truncate">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementBadges({ user, profile, connections }: {
  user: import("@/types").UserType | null;
  profile: UserProfile | null;
  connections: { partner: { name: string } }[];
}) {
  if (!user) return null;
  const joinCount = profile?.participants?.length || 0;
  const createCount = profile?.activitiesCreated?.length || 0;

  const badges = [
    { icon: "🆕", label: "Member", desc: "Joined HobbyHub", earned: true },
    { icon: "⭐", label: "Verified", desc: "Identity verified", earned: user.verified },
    { icon: "🏃", label: "Active", desc: "Joined 3+ activities", earned: joinCount >= 3 },
    { icon: "🎯", label: "Creator", desc: "Created an activity", earned: createCount >= 1 },
    { icon: "🤝", label: "Connected", desc: "5+ connections", earned: connections.length >= 5 },
    { icon: "🔥", label: "Popular", desc: "10+ activities", earned: joinCount >= 10 },
  ];

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-[13px] text-gray-900">Achievements</h4>
        <span className="text-[11px] text-gray-400 font-medium">{earned.length}/{badges.length} earned</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {earned.map((b) => (
          <motion.div
            key={b.label}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex flex-col items-center gap-1 group cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-xl shadow-sm">
              {b.icon}
            </div>
            <span className="text-[9px] font-bold text-gray-700">{b.label}</span>
          </motion.div>
        ))}
        {locked.slice(0, 3 - Math.min(earned.length, 3)).map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1 opacity-30">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl grayscale">
              {b.icon}
            </div>
            <span className="text-[9px] font-bold text-gray-400">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setScreen = useStore((s) => s.setScreen);
  const userLocation = useStore((s) => s.userLocation);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<"joined" | "created">("joined");
  const [availability, setAvailability] = useState("open");
  const [copied, setCopied] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editSkill, setEditSkill] = useState("intermediate");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editRole, setEditRole] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editLookingFor, setEditLookingFor] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editCollege, setEditCollege] = useState("");
  const [editGradYear, setEditGradYear] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [requests, setRequests] = useState<ProfileReq[]>([]);
  const [connections, setConnections] = useState<{ partner: { name: string } }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile/me?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        if (data.requests) setRequests(data.requests);
        if (data.connections) setConnections(data.connections);
      })
      .catch(() => {});
  }, [user]);

  const startEdit = () => {
    if (!user) return;
    const interests = Array.isArray(user.interests) ? user.interests
      : typeof user.interests === "string" ? JSON.parse(user.interests) : [];
    const skills = Array.isArray(user.skills) ? user.skills
      : typeof user.skills === "string" ? JSON.parse(user.skills) : [];
    setEditName(user.name);
    setEditBio(user.bio || "");
    setEditSkill((user as unknown as { skillLevel?: string }).skillLevel || "intermediate");
    setEditInterests(interests);
    setEditRole(user.role || "");
    setEditStage(user.startupStage || "");
    setEditCompany(user.company || "");
    setEditTitle(user.title || "");
    setEditLookingFor(user.lookingFor || "");
    setEditSkills(skills);
    setEditCollege(user.collegeName || "");
    setEditGradYear(user.graduationYear ? String(user.graduationYear) : "");
    setAvatarPreview(user.avatar || null);
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName, bio: editBio, skillLevel: editSkill,
          interests: JSON.stringify(editInterests), avatar: avatarPreview || "",
          role: editRole, startupStage: editStage, company: editCompany, title: editTitle,
          lookingFor: editLookingFor, skills: JSON.stringify(editSkills),
          collegeName: editCollege, graduationYear: parseInt(editGradYear) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || "Failed to save profile.");
        return;
      }
      const updated = await res.json();
      let interests = updated.interests || [];
      let skills = updated.skills || [];
      try { if (typeof interests === "string") interests = JSON.parse(interests); } catch { interests = []; }
      try { if (typeof skills === "string") skills = JSON.parse(skills); } catch { skills = []; }
      setUser({ ...user, ...updated, interests, skills });
      localStorage.setItem("hobbyhub_user", JSON.stringify(updated));
      setEditing(false);
    } catch {
      setSaveError("Network error. Check your connection.");
    } finally { setSaving(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRequest = async (requestId: string, status: "accepted" | "rejected") => {
    await fetch("/api/profile-request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleShare = () => {
    const text = `Connect with ${user?.name} on HobbyHub!`;
    if (navigator.share) {
      navigator.share({ title: "HobbyHub Profile", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("hobbyhub_user");
    localStorage.removeItem("hobbyhub_token");
    setUser(null);
    setOnboarded(false);
  };

  const interests = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.interests) ? user.interests
      : typeof user.interests === "string" ? JSON.parse(user.interests) : [];
  }, [user]);

  const userSkills: string[] = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.skills) ? user.skills
      : typeof user.skills === "string" ? JSON.parse(user.skills) : [];
  }, [user]);

  if (!user) return null;

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const roleInfo = USER_ROLES.find((r) => r.value === user.role);
  const stageInfo = STARTUP_STAGES.find((s) => s.value === user.startupStage);
  const availInfo = AVAILABILITY_OPTIONS.find((a) => a.value === availability)!;

  const inputCls = "w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 transition-all placeholder:text-gray-400";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="h-full bg-[#f5f5f7] flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white/95 backdrop-blur-2xl border-b border-gray-200/40">
        <h3 className="flex-1 font-extrabold text-[20px] text-gray-900 tracking-tight">Profile</h3>
        {!editing ? (
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-gray-500" />}
            </motion.button>
            <button onClick={startEdit} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[12px] font-semibold hover:bg-gray-200 transition-colors">
              <Edit3 size={12} /> Edit
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3.5 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[12px] font-semibold">Cancel</button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile} disabled={saving}
              className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-[12px] font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </motion.button>
          </div>
        )}
      </div>

      {saveError && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">{saveError}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
              {/* Avatar */}
              <div className="flex justify-center pt-2 pb-1">
                <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-full cursor-pointer group">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 overflow-hidden ring-4 ring-white shadow-lg">
                    {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User size={36} />}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                    <Camera size={12} className="text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider">Basic Info</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Skill Level</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SKILL_LEVELS.map((level) => (
                      <button key={level} onClick={() => setEditSkill(level)}
                        className={`py-2 rounded-lg text-[11px] font-semibold capitalize transition-all ${editSkill === level ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-500"}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider">Professional</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Role</label>
                  <div className="flex flex-wrap gap-1.5">
                    {USER_ROLES.map((r) => (
                      <button key={r.value} onClick={() => setEditRole(r.value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editRole === r.value ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-500"}`}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Stage</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTUP_STAGES.map((s) => (
                      <button key={s.value} onClick={() => setEditStage(s.value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editStage === s.value ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-500"}`}>
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Company</label>
                    <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Title</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Looking For</label>
                  <input value={editLookingFor} onChange={(e) => setEditLookingFor(e.target.value)} placeholder="cofounder, hiring, mentor..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROFESSIONAL_SKILLS.map((s) => (
                      <button key={s} onClick={() => setEditSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${editSkills.includes(s) ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-500"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">College</label>
                    <input value={editCollege} onChange={(e) => setEditCollege(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Year</label>
                    <input type="number" value={editGradYear} onChange={(e) => setEditGradYear(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider">Interests</h4>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map((interest) => (
                    <button key={interest.id}
                      onClick={() => setEditInterests((prev) => prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id])}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editInterests.includes(interest.id) ? "bg-gray-900 text-white" : "bg-[#f5f5f7] text-gray-500"}`}>
                      {interest.icon} {interest.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-4" />
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* ── Hero Card ── */}
              <div className="p-4">
                <div className="bg-white rounded-[24px] overflow-hidden">
                  {/* Top banner gradient */}
                  <div className="h-20 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 relative">
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
                  </div>

                  {/* Avatar floated over banner */}
                  <div className="flex flex-col items-center -mt-11 pb-5 px-5">
                    <div className="relative mb-3">
                      <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 overflow-hidden ring-[3px] ring-white shadow-xl">
                        {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <User size={32} />}
                      </div>
                      {user.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                      {/* Availability dot */}
                      <div className={`absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full border-2 border-white`}
                        style={{ background: availInfo.color }} />
                    </div>

                    <h2 className="text-[21px] font-extrabold text-gray-900 tracking-tight">{user.name}</h2>

                    {(user.title || user.company) && (
                      <p className="text-[13px] text-gray-500 mt-0.5 font-medium">
                        {user.title}{user.title && user.company ? " · " : ""}<span className="font-semibold text-gray-700">{user.company}</span>
                      </p>
                    )}

                    {user.bio && (
                      <p className="text-[13px] text-gray-400 mt-2 text-center leading-relaxed max-w-[280px]">{user.bio}</p>
                    )}

                    {/* Availability selector */}
                    <div className="flex gap-1.5 mt-3">
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
                          onClick={() => setAvailability(opt.value)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            availability === opt.value
                              ? `${opt.bg} ${opt.text} ring-1 ring-current/20`
                              : "bg-[#f5f5f7] text-gray-400"
                          }`}>
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>

                    {/* Role / stage / looking for pills */}
                    {(roleInfo || stageInfo || user.lookingFor) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 justify-center">
                        {roleInfo && (
                          <span className="px-2.5 py-1 bg-[#f5f5f7] text-gray-600 text-[11px] font-semibold rounded-full">
                            {roleInfo.icon} {roleInfo.label}
                          </span>
                        )}
                        {stageInfo && (
                          <span className="px-2.5 py-1 bg-[#f5f5f7] text-gray-600 text-[11px] font-semibold rounded-full">
                            {stageInfo.icon} {stageInfo.label}
                          </span>
                        )}
                        {user.lookingFor && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-semibold rounded-full">
                            Looking for: {user.lookingFor}
                          </span>
                        )}
                      </div>
                    )}

                    {user.collegeName && (
                      <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1 font-medium">
                        <GraduationCap size={11} /> {user.collegeName}
                        {user.graduationYear ? ` '${String(user.graduationYear).slice(-2)}` : ""}
                      </p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
                    {[
                      { value: profile?.activitiesCreated?.length || 0, label: "Created", icon: Zap },
                      { value: profile?.participants?.length || 0, label: "Joined", icon: Target },
                      { value: typeof user.rating === "number" ? user.rating.toFixed(1) : "—", label: "Rating", icon: Star },
                      { value: connections.length, label: "Network", icon: Users },
                    ].map((stat) => (
                      <div key={stat.label} className="py-4 text-center">
                        <motion.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="block text-[18px] font-extrabold text-gray-900"
                        >{stat.value}</motion.span>
                        <span className="text-[10px] text-gray-400 font-medium">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 space-y-2 pb-6">

                {/* Profile Completion */}
                <ProfileCompletion user={user} profile={profile} connections={connections} />

                {/* Connection Requests */}
                {pendingRequests.length > 0 && (
                  <div className="bg-white rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-bold text-[13px] text-gray-900">Requests</h4>
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">{pendingRequests.length}</span>
                    </div>
                    <div className="space-y-2">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="flex items-center gap-3 p-2.5 bg-[#f5f5f7] rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 flex items-center justify-center font-bold text-sm overflow-hidden">
                            {req.requester.avatar ? <img src={req.requester.avatar} alt="" className="w-full h-full object-cover" /> : req.requester.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[13px] truncate text-gray-900">{req.requester.name}</p>
                            <p className="text-[11px] text-gray-400">wants to connect</p>
                          </div>
                          <div className="flex gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRequest(req.id, "accepted")} className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center"><Check size={13} /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRequest(req.id, "rejected")} className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center"><X size={13} /></motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                <AchievementBadges user={user} profile={profile} connections={connections} />

                {/* Network connections preview */}
                {connections.length > 0 && (
                  <div className="bg-white rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-[13px] text-gray-900">Network</h4>
                      <span className="text-[11px] text-violet-500 font-semibold">{connections.length} connections</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {connections.slice(0, 8).map((c, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white flex items-center justify-center text-[11px] font-bold text-gray-600 -ml-1 first:ml-0 shadow-sm"
                        >
                          {c.partner.name.charAt(0)}
                        </motion.div>
                      ))}
                      {connections.length > 8 && (
                        <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 -ml-1 shadow-sm">
                          +{connections.length - 8}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {userSkills.length > 0 && (
                  <div className="bg-white rounded-2xl p-4">
                    <h4 className="font-bold text-[13px] text-gray-900 mb-2.5">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {userSkills.map((s) => (
                        <span key={s} className="px-3 py-1.5 bg-[#f5f5f7] text-gray-700 text-[11px] font-semibold rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div className="bg-white rounded-2xl p-4">
                    <h4 className="font-bold text-[13px] text-gray-900 mb-2.5">Interests</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((i: string) => {
                        const interest = INTERESTS.find((x) => x.id === i);
                        return interest ? (
                          <span key={i} className="px-3 py-1.5 bg-[#f5f5f7] text-gray-600 text-[11px] font-semibold rounded-full">
                            {interest.icon} {interest.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Activity History — tabbed */}
                <div className="bg-white rounded-2xl overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex border-b border-gray-100">
                    {[
                      { key: "joined" as const, label: "Joined", count: profile?.participants?.length || 0, icon: TrendingUp },
                      { key: "created" as const, label: "Created", count: profile?.activitiesCreated?.length || 0, icon: Zap },
                    ].map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-semibold transition-colors relative ${
                          activeTab === tab.key ? "text-gray-900" : "text-gray-400"
                        }`}>
                        <tab.icon size={13} />
                        {tab.label}
                        {tab.count > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                          }`}>{tab.count}</span>
                        )}
                        {activeTab === tab.key && (
                          <motion.div layoutId="actTab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-3">
                    <AnimatePresence mode="wait">
                      {activeTab === "joined" ? (
                        <motion.div key="joined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {profile?.participants && profile.participants.length > 0 ? (
                            <div className="space-y-1">
                              {profile.participants.slice(0, 6).map((p) => (
                                <div key={p.activity.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f7] transition-colors cursor-pointer">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0"
                                    style={{ background: `${TYPE_COLORS[p.activity.type]}12`, color: TYPE_COLORS[p.activity.type] }}>
                                    {ACTIVITY_TYPES.find((t) => t.value === p.activity.type)?.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[13px] text-gray-900 truncate">{p.activity.title}</p>
                                    <p className="text-[11px] text-gray-400">by {p.activity.creator.name}</p>
                                  </div>
                                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState icon={<Clock size={20} className="text-gray-300" />} text="No activities joined yet" sub="Explore the map to get started" />
                          )}
                        </motion.div>
                      ) : (
                        <motion.div key="created" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {profile?.activitiesCreated && profile.activitiesCreated.length > 0 ? (
                            <div className="space-y-1">
                              {profile.activitiesCreated.slice(0, 6).map((a) => (
                                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f7] transition-colors cursor-pointer">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0"
                                    style={{ background: `${TYPE_COLORS[a.type]}12`, color: TYPE_COLORS[a.type] }}>
                                    {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[13px] text-gray-900 truncate">{a.title}</p>
                                    <p className="text-[11px] text-gray-400 capitalize">{a.type}</p>
                                  </div>
                                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState icon={<Zap size={20} className="text-gray-300" />} text="No activities created" sub="Tap + to create your first one" />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Seed demo data */}
                <button
                  onClick={async () => {
                    if (!userLocation.lat) return;
                    setSeeding(true);
                    await fetch(`/api/seed?lat=${userLocation.lat}&lng=${userLocation.lng}`, { method: "POST" });
                    setSeeding(false);
                    setScreen("map");
                  }}
                  className="w-full py-2.5 text-violet-400 font-medium text-[12px] flex items-center justify-center gap-1.5 hover:text-violet-600 transition-colors"
                >
                  {seeding ? "Loading demo data..." : "✨ Load Demo Data Nearby"}
                </button>

                {/* Logout */}
                <button onClick={logout}
                  className="w-full py-3 text-gray-400 font-medium text-[12px] flex items-center justify-center gap-1.5 hover:text-red-400 transition-colors">
                  <LogOut size={13} /> Sign out
                </button>
                <div className="h-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="text-center py-7">
      <div className="w-12 h-12 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-2">{icon}</div>
      <p className="text-[12px] text-gray-500 font-semibold">{text}</p>
      <p className="text-[11px] text-gray-300 mt-0.5">{sub}</p>
    </div>
  );
}
