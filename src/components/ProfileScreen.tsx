"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Star, Camera, Check, X, Shield, UserCheck, Briefcase, GraduationCap, Users, LogOut, ChevronRight, Settings, Edit3 } from "lucide-react";
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

export default function ProfileScreen() {
  const { user, setUser, setOnboarded, setScreen } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
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
    const interests = Array.isArray(user.interests)
      ? user.interests
      : typeof user.interests === "string" ? JSON.parse(user.interests) : [];
    const skills = Array.isArray(user.skills)
      ? user.skills
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
      const userData = { ...user, ...updated, interests, skills };
      setUser(userData);
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

  const logout = () => {
    localStorage.removeItem("hobbyhub_user");
    localStorage.removeItem("hobbyhub_token");
    setUser(null);
    setOnboarded(false);
  };

  if (!user) return null;

  const interests = Array.isArray(user.interests)
    ? user.interests
    : typeof user.interests === "string" ? JSON.parse(user.interests) : [];
  const userSkills: string[] = Array.isArray(user.skills)
    ? user.skills
    : typeof user.skills === "string" ? JSON.parse(user.skills) : [];
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const roleInfo = USER_ROLES.find((r) => r.value === user.role);
  const stageInfo = STARTUP_STAGES.find((s) => s.value === user.startupStage);

  const inputCls = "w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 outline-none transition-all";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <h3 className="flex-1 font-bold text-lg">Profile</h3>
        {!editing ? (
          <button onClick={startEdit} className="flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors">
            <Edit3 size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold">Cancel</button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile} disabled={saving}
              className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
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
            <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 space-y-5">
              {/* Avatar */}
              <div className="flex justify-center">
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white cursor-pointer relative overflow-hidden shadow-lg shadow-violet-200 group">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User size={40} />}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={22} className="text-white" /></div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-3xl p-6 space-y-5 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-4 bg-violet-500 rounded-full" /> Basic Info</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Skill Level</label>
                  <div className="flex gap-2">
                    {SKILL_LEVELS.map((level) => (
                      <button key={level} onClick={() => setEditSkill(level)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${editSkill === level ? "bg-violet-600 text-white shadow-sm" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Professional */}
              <div className="bg-white rounded-3xl p-6 space-y-5 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full" /> Professional</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Role</label>
                  <div className="flex flex-wrap gap-2">
                    {USER_ROLES.map((r) => (
                      <button key={r.value} onClick={() => setEditRole(r.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${editRole === r.value ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Stage</label>
                  <div className="flex flex-wrap gap-2">
                    {STARTUP_STAGES.map((s) => (
                      <button key={s.value} onClick={() => setEditStage(s.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${editStage === s.value ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Company</label>
                    <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Looking For</label>
                  <input value={editLookingFor} onChange={(e) => setEditLookingFor(e.target.value)} placeholder="cofounder, hiring, mentor..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROFESSIONAL_SKILLS.map((s) => (
                      <button key={s} onClick={() => setEditSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${editSkills.includes(s) ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">College</label>
                    <input value={editCollege} onChange={(e) => setEditCollege(e.target.value)} className={inputCls} />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Year</label>
                    <input type="number" value={editGradYear} onChange={(e) => setEditGradYear(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-white rounded-3xl p-6 space-y-4 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-4 bg-emerald-500 rounded-full" /> Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button key={interest.id}
                      onClick={() => setEditInterests((prev) => prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${editInterests.includes(interest.id) ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                      {interest.icon} {interest.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-4" />
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Hero Header */}
              <div className="relative overflow-hidden px-5 pt-8 pb-16" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 30%, #8b5cf6 60%, #a78bfa 100%)" }}>
                {/* Mesh-like pattern overlay */}
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 40% 80%, white 1.5px, transparent 1.5px)", backgroundSize: "60px 60px, 80px 80px, 100px 100px" }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(135deg, transparent 40%, white 50%, transparent 60%)", backgroundSize: "200% 200%" }} />
                <div className="relative z-10 flex items-center gap-4">
                  {/* Avatar with gradient ring */}
                  <div className="p-[3px] rounded-[26px] bg-gradient-to-br from-white/60 via-white/30 to-white/60 shadow-xl shadow-purple-900/20">
                    <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white overflow-hidden">
                      {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <User size={40} />}
                    </div>
                  </div>
                  <div className="flex-1 text-white">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-extrabold tracking-tight">{user.name}</h2>
                      {user.verified && (
                        <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-[10px] font-bold rounded-full flex items-center gap-1 border border-white/20">
                          <Shield size={10} /> Verified
                        </span>
                      )}
                    </div>
                    {(user.title || user.company) && (
                      <p className="text-white/85 text-sm mt-1 font-medium">{user.title}{user.title && user.company ? " at " : ""}{user.company}</p>
                    )}
                    <p className="text-white/55 text-sm mt-0.5">{user.bio || "No bio yet"}</p>
                  </div>
                </div>

                {/* Badges */}
                {(roleInfo || stageInfo) && (
                  <div className="relative z-10 flex gap-2 mt-4 flex-wrap">
                    {roleInfo && (
                      <span className="px-3.5 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-xl border border-white/10">
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                    )}
                    {stageInfo && (
                      <span className="px-3.5 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-xl border border-white/10">
                        {stageInfo.icon} {stageInfo.label}
                      </span>
                    )}
                    {user.lookingFor && (
                      <span className="px-3.5 py-1.5 bg-emerald-400/25 backdrop-blur-sm text-white text-xs font-semibold rounded-xl border border-emerald-300/20">
                        Looking for: {user.lookingFor}
                      </span>
                    )}
                  </div>
                )}

                {user.collegeName && (
                  <p className="relative z-10 text-white/50 text-xs mt-3 flex items-center gap-1">
                    <GraduationCap size={12} /> {user.collegeName}
                    {user.graduationYear ? ` '${String(user.graduationYear).slice(-2)}` : ""}
                  </p>
                )}
              </div>

              {/* Stats Card — overlapping hero */}
              <div className="mx-4 -mt-10 bg-white rounded-3xl p-5 shadow-lg shadow-gray-200/60 border border-gray-100/80">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: profile?.activitiesCreated?.length || 0, label: "Created", bg: "bg-violet-50", text: "text-violet-700" },
                    { value: profile?.participants?.length || 0, label: "Joined", bg: "bg-blue-50", text: "text-blue-700" },
                    { value: user.rating || 0, label: "Rating", icon: <Star size={14} className="text-amber-400 inline" />, bg: "bg-amber-50", text: "text-amber-700" },
                    { value: connections.length, label: "Network", bg: "bg-emerald-50", text: "text-emerald-700" },
                  ].map((stat) => (
                    <div key={stat.label} className={`text-center p-2.5 ${stat.bg} rounded-2xl`}>
                      <span className={`block text-xl font-extrabold ${stat.text}`}>
                        {stat.icon || null}{stat.value}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Connection Requests */}
                {pendingRequests.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <UserCheck size={16} className="text-violet-600" /> Requests
                      <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-bold rounded-full">{pendingRequests.length}</span>
                    </h4>
                    <div className="space-y-2.5">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                            {req.requester.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{req.requester.name}</p>
                            <p className="text-xs text-gray-400">wants to connect</p>
                          </div>
                          <div className="flex gap-1.5">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRequest(req.id, "accepted")} className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm"><Check size={14} /></motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleRequest(req.id, "rejected")} className="w-9 h-9 bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center"><X size={14} /></motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {userSkills.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Briefcase size={14} className="text-blue-500" /></div> Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {userSkills.map((s) => (
                        <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl border border-blue-100/60">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h4 className="font-bold text-sm mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((i: string) => {
                        const interest = INTERESTS.find((x) => x.id === i);
                        return interest ? (
                          <span key={i} className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-600 text-xs font-semibold">
                            {interest.icon} {interest.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Activity History */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <h4 className="font-bold text-sm mb-3">Recent Activity</h4>
                  {profile?.participants && profile.participants.length > 0 ? (
                    <div className="space-y-2">
                      {profile.participants.slice(0, 5).map((p) => (
                        <div key={p.activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0"
                            style={{ background: `${TYPE_COLORS[p.activity.type]}15`, color: TYPE_COLORS[p.activity.type] }}>
                            {ACTIVITY_TYPES.find((t) => t.value === p.activity.type)?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{p.activity.title}</p>
                            <p className="text-xs text-gray-400">by {p.activity.creator.name}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">No activities yet. Explore the map!</p>
                  )}
                </div>

                {/* Logout */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={logout}
                  className="w-full py-3 text-gray-400 font-medium text-xs flex items-center justify-center gap-1.5 hover:text-red-400 transition-colors"
                >
                  <LogOut size={14} /> Log Out
                </motion.button>

                <div className="h-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
