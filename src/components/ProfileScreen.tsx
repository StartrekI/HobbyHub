"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Star, Camera, Check, X, GraduationCap, Users,
  LogOut, ChevronRight, MapPin, Zap, Trophy, Target,
  Clock, TrendingUp, Share2, CheckCircle2, Eye, EyeOff,
  ArrowLeft, Settings, Pencil, Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="border-0 p-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h4 className="font-bold text-sm text-zinc-950">Complete your profile</h4>
            <p className="text-xs text-[#71717b] mt-0.5">Get discovered by more people</p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f4f4f5" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="14" fill="none" stroke="#8e51ff" strokeWidth="3"
                strokeDasharray={`${pct * 0.879} 100`}
                initial={{ strokeDasharray: "0 100" }}
                animate={{ strokeDasharray: `${pct * 0.879} 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-zinc-950">{pct}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {checks.filter((c) => !c.done).slice(0, 4).map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-lg">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 shrink-0" />
              <span className="text-[10px] text-[#71717b] font-medium truncate">{c.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <Card className="border-0 p-4">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm text-zinc-950">Achievements</h4>
          <span className="text-xs text-[#71717b] font-medium">{earned.length}/{badges.length} earned</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {earned.map((b) => (
            <motion.div
              key={b.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="flex flex-col items-center gap-1 cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl">
                {b.icon}
              </div>
              <span className="text-[9px] font-bold text-zinc-950">{b.label}</span>
            </motion.div>
          ))}
          {locked.slice(0, 3 - Math.min(earned.length, 3)).map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1 opacity-30">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-xl grayscale">
                {b.icon}
              </div>
              <span className="text-[9px] font-bold text-[#71717b]">{b.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
  const [locationSharing, setLocationSharing] = useState(user?.shareLocation !== false);
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

  const inputCls = "w-full px-4 py-2.5 bg-zinc-100 rounded-xl text-sm outline-none border border-transparent focus:bg-white focus:border-[#8e51ff] focus:shadow-[0_0_0_3px_rgba(142,81,255,0.12)] transition-all placeholder:text-[#71717b]";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="h-full bg-white flex flex-col">

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Edit Mode Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <button onClick={() => setEditing(false)} className="text-sm text-[#71717b] font-medium">Cancel</button>
                <span className="font-semibold text-zinc-950 text-lg">Edit Profile</span>
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile} disabled={saving}
                  className="text-sm text-[#8e51ff] font-semibold disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </motion.button>
              </div>

              {saveError && (
                <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">{saveError}</div>
              )}

              <div className="px-6 space-y-4 pb-8">
                {/* Avatar */}
                <div className="flex justify-center pt-2 pb-1">
                  <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-full cursor-pointer group">
                    <div className="w-full h-full rounded-full bg-zinc-200 flex items-center justify-center text-[#71717b] overflow-hidden ring-4 ring-white shadow-lg">
                      {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User size={36} />}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#8e51ff] rounded-full flex items-center justify-center shadow-md">
                      <Camera size={12} className="text-white" />
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                </div>

                {/* Basic Info */}
                <Card className="border-0 bg-zinc-50 p-4">
                  <CardContent className="p-0 space-y-3">
                    <h4 className="font-bold text-xs text-[#71717b] uppercase tracking-wider">Basic Info</h4>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1">Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1">Bio</label>
                      <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1.5">Skill Level</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SKILL_LEVELS.map((level) => (
                          <button key={level} onClick={() => setEditSkill(level)}
                            className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${editSkill === level ? "bg-[#8e51ff] text-white" : "bg-zinc-100 text-[#71717b]"}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional */}
                <Card className="border-0 bg-zinc-50 p-4">
                  <CardContent className="p-0 space-y-3">
                    <h4 className="font-bold text-xs text-[#71717b] uppercase tracking-wider">Professional</h4>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1.5">Role</label>
                      <div className="flex flex-wrap gap-1.5">
                        {USER_ROLES.map((r) => (
                          <button key={r.value} onClick={() => setEditRole(r.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${editRole === r.value ? "bg-[#8e51ff] text-white" : "bg-zinc-100 text-[#71717b]"}`}>
                            {r.icon} {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1.5">Stage</label>
                      <div className="flex flex-wrap gap-1.5">
                        {STARTUP_STAGES.map((s) => (
                          <button key={s.value} onClick={() => setEditStage(s.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${editStage === s.value ? "bg-[#8e51ff] text-white" : "bg-zinc-100 text-[#71717b]"}`}>
                            {s.icon} {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#71717b] mb-1">Company</label>
                        <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#71717b] mb-1">Title</label>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1">Looking For</label>
                      <input value={editLookingFor} onChange={(e) => setEditLookingFor(e.target.value)} placeholder="cofounder, hiring, mentor..." className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#71717b] mb-1.5">Skills</label>
                      <div className="flex flex-wrap gap-1.5">
                        {PROFESSIONAL_SKILLS.map((s) => (
                          <button key={s} onClick={() => setEditSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${editSkills.includes(s) ? "bg-[#8e51ff] text-white" : "bg-zinc-100 text-[#71717b]"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-[#71717b] mb-1">College</label>
                        <input value={editCollege} onChange={(e) => setEditCollege(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#71717b] mb-1">Year</label>
                        <input type="number" value={editGradYear} onChange={(e) => setEditGradYear(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interests */}
                <Card className="border-0 bg-zinc-50 p-4">
                  <CardContent className="p-0 space-y-3">
                    <h4 className="font-bold text-xs text-[#71717b] uppercase tracking-wider">Interests</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {INTERESTS.map((interest) => (
                        <button key={interest.id}
                          onClick={() => setEditInterests((prev) => prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id])}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${editInterests.includes(interest.id) ? "bg-[#8e51ff] text-white" : "bg-zinc-100 text-[#71717b]"}`}>
                          {interest.icon} {interest.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Banner Image */}
              <div className="relative w-full h-40 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#8e51ff] via-[#a78bfa] to-[#6d28d9]" />
                <div className="bg-[#8e51ff]/30 absolute inset-0" />
                <div className="flex absolute inset-x-4 top-4 justify-between items-center">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setScreen("map")}
                    className="rounded-full bg-white/80 flex justify-center items-center w-8 h-8"
                  >
                    <ArrowLeft className="size-4 text-zinc-950" />
                  </motion.button>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="rounded-full bg-white/80 flex justify-center items-center w-8 h-8"
                    >
                      <Settings className="size-4 text-zinc-950" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="rounded-full bg-white/80 flex justify-center items-center w-8 h-8"
                    >
                      {copied ? <CheckCircle2 className="size-4 text-emerald-600" /> : <Share2 className="size-4 text-zinc-950" />}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Profile photo + Edit button */}
              <div className="relative z-10 -mt-14 px-6">
                <div className="flex justify-between items-end">
                  <div className="shadow-lg rounded-full border-white border-4 border-solid w-24 h-24 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile photo" className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                        <User size={36} className="text-[#71717b]" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={startEdit}
                    className="font-medium rounded-full bg-[#8e51ff] text-violet-50 text-sm leading-5 px-4 h-9 hover:bg-[#7c3aed]"
                  >
                    <Pencil className="size-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                </div>

                {/* Name + verified badge */}
                <div className="flex mt-4 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950 text-lg leading-7">{user.name}</span>
                    {user.verified && (
                      <div className="rounded-full bg-[#8e51ff] flex justify-center items-center w-5 h-5">
                        <Check className="size-3 text-violet-50" />
                      </div>
                    )}
                  </div>
                  <span className="text-[#71717b] text-sm leading-5">@{user.name?.toLowerCase().replace(/\s+/g, "")}</span>

                  {user.bio && (
                    <p className="text-zinc-950 text-sm leading-5 mt-1">{user.bio}</p>
                  )}

                  {/* Location + join date */}
                  <div className="flex mt-2 items-center gap-4">
                    <div className="text-[#71717b] text-sm leading-5 flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      <span>{user.collegeName || "Nearby"}</span>
                    </div>
                    <div className="text-[#71717b] text-sm leading-5 flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      <span>Member</span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex mt-4 items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-zinc-950 text-lg leading-7">{connections.length}</span>
                    <span className="text-[#71717b] text-xs leading-4">Connections</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-zinc-950 text-lg leading-7">{profile?.participants?.length || 0}</span>
                    <span className="text-[#71717b] text-xs leading-4">Activities</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-zinc-950 text-lg leading-7">{profile?.activitiesCreated?.length || 0}</span>
                    <span className="text-[#71717b] text-xs leading-4">Created</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-zinc-950 text-lg leading-7">{typeof user.rating === "number" ? user.rating.toFixed(1) : "---"}</span>
                    <span className="text-[#71717b] text-xs leading-4">Rating</span>
                  </div>
                </div>
              </div>

              {/* Interest badges */}
              {interests.length > 0 && (
                <div className="mt-6 px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {interests.map((i: string) => {
                      const interest = INTERESTS.find((x) => x.id === i);
                      return interest ? (
                        <span key={i} className="font-medium rounded-full bg-[#8e51ff]/10 text-[#8e51ff] text-xs leading-4 px-3 py-1.5">
                          {interest.icon} {interest.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="mt-4 px-6">
                <div className="flex gap-1.5">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
                      onClick={() => setAvailability(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        availability === opt.value
                          ? `${opt.bg} ${opt.text} border-current/10`
                          : "bg-zinc-100 text-[#71717b] border-transparent"
                      }`}>
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Professional info badges */}
              {(roleInfo || stageInfo || user.lookingFor) && (
                <div className="mt-3 px-6">
                  <div className="flex flex-wrap gap-1.5">
                    {roleInfo && (
                      <span className="px-3 py-1.5 bg-zinc-100 text-zinc-950 text-xs font-semibold rounded-full">
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                    )}
                    {stageInfo && (
                      <span className="px-3 py-1.5 bg-zinc-100 text-zinc-950 text-xs font-semibold rounded-full">
                        {stageInfo.icon} {stageInfo.label}
                      </span>
                    )}
                    {user.lookingFor && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                        Looking for: {user.lookingFor}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {user.collegeName && (
                <p className="text-xs text-[#71717b] mt-2 px-6 flex items-center gap-1 font-medium">
                  <GraduationCap size={12} /> {user.collegeName}
                  {user.graduationYear ? ` '${String(user.graduationYear).slice(-2)}` : ""}
                </p>
              )}

              {/* Activity Stats Card */}
              <div className="mt-6 px-6">
                <Card className="bg-zinc-100/50 border-0 p-4">
                  <CardContent className="p-0 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-950 text-sm leading-5">Activity Stats</span>
                      <span className="text-[#71717b] text-xs leading-4">This Month</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-white flex p-2 flex-col items-center gap-1">
                        <div className="rounded-full bg-green-100 flex justify-center items-center w-8 h-8">
                          <Trophy className="size-4 text-green-600" />
                        </div>
                        <span className="font-bold text-zinc-950 text-base leading-6">{profile?.participants?.length || 0}</span>
                        <span className="text-[#71717b] text-[10px]">Attended</span>
                      </div>
                      <div className="rounded-lg bg-white flex p-2 flex-col items-center gap-1">
                        <div className="rounded-full bg-amber-100 flex justify-center items-center w-8 h-8">
                          <Star className="size-4 text-amber-600" />
                        </div>
                        <span className="font-bold text-zinc-950 text-base leading-6">{typeof user.rating === "number" ? user.rating.toFixed(1) : "---"}</span>
                        <span className="text-[#71717b] text-[10px]">Rating</span>
                      </div>
                      <div className="rounded-lg bg-white flex p-2 flex-col items-center gap-1">
                        <div className="rounded-full bg-blue-100 flex justify-center items-center w-8 h-8">
                          <Users className="size-4 text-blue-600" />
                        </div>
                        <span className="font-bold text-zinc-950 text-base leading-6">{connections.length}</span>
                        <span className="text-[#71717b] text-[10px]">Connects</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {saveError && (
                <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">{saveError}</div>
              )}

              <div className="px-6 mt-6 space-y-4 pb-6">

                {/* Profile Completion */}
                <ProfileCompletion user={user} profile={profile} connections={connections} />

                {/* Connection Requests */}
                {pendingRequests.length > 0 && (
                  <Card className="border-0 p-4">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-sm text-zinc-950">Requests</h4>
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">{pendingRequests.length}</span>
                      </div>
                      <div className="space-y-2">
                        {pendingRequests.map((req) => (
                          <div key={req.id} className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-zinc-200 text-[#71717b] flex items-center justify-center font-bold text-sm overflow-hidden">
                              {req.requester.avatar ? <img src={req.requester.avatar} alt="" className="w-full h-full object-cover" /> : req.requester.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate text-zinc-950">{req.requester.name}</p>
                              <p className="text-xs text-[#71717b]">wants to connect</p>
                            </div>
                            <div className="flex gap-1.5">
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRequest(req.id, "accepted")} className="w-8 h-8 bg-[#8e51ff] text-white rounded-full flex items-center justify-center"><Check size={13} /></motion.button>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRequest(req.id, "rejected")} className="w-8 h-8 bg-zinc-200 text-[#71717b] rounded-full flex items-center justify-center"><X size={13} /></motion.button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Achievements */}
                <AchievementBadges user={user} profile={profile} connections={connections} />

                {/* Network connections preview */}
                {connections.length > 0 && (
                  <Card className="border-0 p-4">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-zinc-950">Network</h4>
                        <span className="text-xs text-[#8e51ff] font-semibold">{connections.length} connections</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {connections.slice(0, 8).map((c, i) => (
                          <motion.div key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="w-9 h-9 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center text-[11px] font-bold text-zinc-950 -ml-1 first:ml-0 shadow-sm"
                          >
                            {c.partner.name.charAt(0)}
                          </motion.div>
                        ))}
                        {connections.length > 8 && (
                          <div className="w-9 h-9 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#71717b] -ml-1 shadow-sm">
                            +{connections.length - 8}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Skills */}
                {userSkills.length > 0 && (
                  <Card className="border-0 p-4">
                    <CardContent className="p-0">
                      <h4 className="font-semibold text-sm text-zinc-950 mb-2.5">Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {userSkills.map((s) => (
                          <span key={s} className="px-3 py-1.5 bg-zinc-100 text-zinc-950 text-xs font-semibold rounded-full">{s}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity - tabbed */}
                <div>
                  <div className="flex mb-4 justify-between items-center">
                    <span className="font-semibold text-zinc-950 text-sm leading-5">Recent Activity</span>
                    <span className="font-medium text-[#8e51ff] text-xs leading-4">See All</span>
                  </div>

                  {/* Tab bar */}
                  <div className="flex gap-2 mb-4">
                    {[
                      { key: "joined" as const, label: "Joined", count: profile?.participants?.length || 0, icon: TrendingUp },
                      { key: "created" as const, label: "Created", count: profile?.activitiesCreated?.length || 0, icon: Zap },
                    ].map((tab) => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                          activeTab === tab.key ? "bg-[#8e51ff] text-white" : "bg-zinc-100 text-[#71717b]"
                        }`}>
                        <tab.icon size={13} />
                        {tab.label}
                        {tab.count > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.key ? "bg-white/20 text-white" : "bg-zinc-200 text-[#71717b]"
                          }`}>{tab.count}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === "joined" ? (
                      <motion.div key="joined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {profile?.participants && profile.participants.length > 0 ? (
                          profile.participants.slice(0, 6).map((p) => (
                            <Card key={p.activity.id} className="border-zinc-200 border-0 p-4">
                              <CardContent className="p-0">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm"
                                    style={{ background: `${TYPE_COLORS[p.activity.type]}20`, color: TYPE_COLORS[p.activity.type] }}>
                                    {ACTIVITY_TYPES.find((t) => t.value === p.activity.type)?.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-zinc-950 text-sm leading-5 truncate">{p.activity.title}</span>
                                    </div>
                                    <span className="text-[#71717b] text-xs leading-4">by {p.activity.creator.name}</span>
                                  </div>
                                  <ChevronRight size={14} className="text-[#71717b] shrink-0 mt-1" />
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <EmptyState icon={<Clock size={20} className="text-zinc-300" />} text="No activities joined yet" sub="Explore the map to get started" />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div key="created" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {profile?.activitiesCreated && profile.activitiesCreated.length > 0 ? (
                          profile.activitiesCreated.slice(0, 6).map((a) => (
                            <Card key={a.id} className="border-zinc-200 border-0 p-4">
                              <CardContent className="p-0">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm"
                                    style={{ background: `${TYPE_COLORS[a.type]}20`, color: TYPE_COLORS[a.type] }}>
                                    {ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-zinc-950 text-sm leading-5 truncate">{a.title}</span>
                                    </div>
                                    <span className="text-[#71717b] text-xs leading-4 capitalize">{a.type}</span>
                                  </div>
                                  <ChevronRight size={14} className="text-[#71717b] shrink-0 mt-1" />
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <EmptyState icon={<Zap size={20} className="text-zinc-300" />} text="No activities created" sub="Tap + to create your first one" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings */}
                <Card className="border-0 p-4">
                  <CardContent className="p-0">
                    <h4 className="font-semibold text-sm text-zinc-950 mb-3">Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${locationSharing ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-[#71717b]"}`}>
                            {locationSharing ? <Eye size={15} /> : <EyeOff size={15} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-950">Location Status</p>
                            <p className="text-xs text-[#71717b]">{locationSharing ? "Others can see you on the map" : "You are hidden from the map"}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const newVal = !locationSharing;
                            setLocationSharing(newVal);
                            if (user) {
                              await fetch(`/api/users/${user.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ shareLocation: newVal }),
                              });
                              const updated = { ...user, shareLocation: newVal };
                              setUser(updated);
                              localStorage.setItem("hobbyhub_user", JSON.stringify(updated));
                            }
                          }}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${locationSharing ? "bg-emerald-500" : "bg-zinc-300"}`}
                        >
                          <motion.div
                            animate={{ x: locationSharing ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Seed demo data */}
                <button
                  onClick={async () => {
                    if (!userLocation.lat) return;
                    setSeeding(true);
                    await fetch(`/api/seed?lat=${userLocation.lat}&lng=${userLocation.lng}`, { method: "POST" });
                    setSeeding(false);
                    setScreen("map");
                  }}
                  className="w-full py-2.5 text-[#8e51ff] font-medium text-xs flex items-center justify-center gap-1.5 hover:text-[#7c3aed] transition-colors"
                >
                  {seeding ? "Loading demo data..." : "Load Demo Data Nearby"}
                </button>

                {/* Logout */}
                <button onClick={logout}
                  className="w-full py-3 text-[#71717b] font-medium text-xs flex items-center justify-center gap-1.5 hover:text-red-400 transition-colors">
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
      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-2">{icon}</div>
      <p className="text-xs text-[#71717b] font-semibold">{text}</p>
      <p className="text-xs text-zinc-300 mt-0.5">{sub}</p>
    </div>
  );
}
