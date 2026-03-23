"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Star, Camera, Check, X, Shield, UserCheck, Briefcase, GraduationCap, Users } from "lucide-react";
import { useStore } from "@/store";
import { INTERESTS, TYPE_COLORS, ACTIVITY_TYPES, USER_ROLES, STARTUP_STAGES, PROFESSIONAL_SKILLS } from "@/lib/utils";

interface UserProfile {
  activitiesCreated: { id: string; title: string; type: string }[];
  participants: { activity: { id: string; title: string; type: string; creator: { name: string } } }[];
}

interface ProfileReq {
  id: string;
  status: string;
  requester: { id: string; name: string };
}

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

export default function ProfileScreen() {
  const { user, setUser, setOnboarded } = useStore();
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
        setSaveError(err.error || "Failed to save profile. Please try again.");
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
      setSaveError("Network error. Please check your connection.");
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="flex-1 font-bold text-lg">Profile</h3>
        {!editing ? (
          <button onClick={startEdit} className="text-violet-600 font-semibold text-sm">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-gray-400"><X size={20} /></button>
            <button onClick={saveProfile} disabled={saving} className="text-violet-600 font-semibold text-sm">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {saveError}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-6">
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-600 to-indigo-400 flex items-center justify-center text-white cursor-pointer relative overflow-hidden">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User size={36} />}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera size={20} className="text-white" /></div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-violet-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Skill Level</label>
                  <div className="flex gap-2">
                    {SKILL_LEVELS.map((level) => (
                      <button key={level} onClick={() => setEditSkill(level)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${editSkill === level ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Professional edit */}
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Role</label>
                  <div className="flex flex-wrap gap-1.5">
                    {USER_ROLES.map((r) => (
                      <button key={r.value} onClick={() => setEditRole(r.value)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${editRole === r.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Startup Stage</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTUP_STAGES.map((s) => (
                      <button key={s.value} onClick={() => setEditStage(s.value)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${editStage === s.value ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Company</label>
                    <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Title</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Looking For</label>
                  <input value={editLookingFor} onChange={(e) => setEditLookingFor(e.target.value)} placeholder="cofounder, hiring, mentor..." className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Professional Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROFESSIONAL_SKILLS.map((s) => (
                      <button key={s} onClick={() => setEditSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${editSkills.includes(s) ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-500 mb-1">College</label>
                    <input value={editCollege} onChange={(e) => setEditCollege(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Grad Year</label>
                    <input type="number" value={editGradYear} onChange={(e) => setEditGradYear(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-violet-600 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-2">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button key={interest.id}
                        onClick={() => setEditInterests((prev) => prev.includes(interest.id) ? prev.filter((i) => i !== interest.id) : [...prev, interest.id])}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${editInterests.includes(interest.id) ? "bg-violet-600 text-white font-semibold" : "bg-gray-100 text-gray-500"}`}>
                        {interest.icon} {interest.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* View Mode */}
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-600 to-indigo-400 flex items-center justify-center text-white overflow-hidden">
                  {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <User size={36} />}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  {user.verified && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
                      <Shield size={10} /> Verified
                    </span>
                  )}
                </div>
                {(user.title || user.company) && (
                  <p className="text-sm text-gray-500">{user.title}{user.title && user.company ? " at " : ""}{user.company}</p>
                )}
                <p className="text-sm text-gray-500">{user.bio || "No bio yet"}</p>

                {/* Professional badges */}
                {(roleInfo || stageInfo || user.lookingFor) && (
                  <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    {roleInfo && (
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-600 text-xs font-semibold rounded-full">
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                    )}
                    {stageInfo && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                        {stageInfo.icon} {stageInfo.label}
                      </span>
                    )}
                    {user.lookingFor && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
                        Looking for: {user.lookingFor}
                      </span>
                    )}
                  </div>
                )}

                {user.collegeName && (
                  <p className="text-xs text-gray-400 mt-1">
                    <GraduationCap size={12} className="inline -mt-0.5" /> {user.collegeName}
                    {user.graduationYear ? ` '${String(user.graduationYear).slice(-2)}` : ""}
                  </p>
                )}

                <div className="flex justify-center gap-8 mt-5">
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-violet-600">
                      {profile?.activitiesCreated?.length || 0}
                    </span>
                    <span className="text-xs text-gray-400">Created</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-violet-600">
                      {profile?.participants?.length || 0}
                    </span>
                    <span className="text-xs text-gray-400">Joined</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-violet-600">
                      <Star size={16} className="inline -mt-0.5" /> {user.rating}
                    </span>
                    <span className="text-xs text-gray-400">Rating</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-extrabold text-violet-600">
                      <Users size={16} className="inline -mt-0.5" /> {connections.length}
                    </span>
                    <span className="text-xs text-gray-400">Network</span>
                  </div>
                </div>
              </div>

              {/* Professional Skills */}
              {userSkills.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><Briefcase size={16} /> Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {userSkills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Connection Requests */}
              {pendingRequests.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <UserCheck size={16} /> Connection Requests
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-xs font-bold rounded-full">{pendingRequests.length}</span>
                  </h4>
                  <div className="space-y-2">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold">{req.requester.name.charAt(0)}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{req.requester.name}</p>
                          <p className="text-xs text-gray-400">wants to connect</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleRequest(req.id, "accepted")} className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center"><Check size={14} /></button>
                          <button onClick={() => handleRequest(req.id, "rejected")} className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              <div className="mt-4">
                <h4 className="font-bold mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i: string) => {
                    const interest = INTERESTS.find((x) => x.id === i);
                    return interest ? (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold">
                        {interest.icon} {interest.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Activity History */}
              <div className="mt-6">
                <h4 className="font-bold mb-3">Activity History</h4>
                {profile?.participants && profile.participants.length > 0 ? (
                  <div className="space-y-2">
                    {profile.participants.map((p) => (
                      <div key={p.activity.id} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm"
                          style={{ background: `${TYPE_COLORS[p.activity.type]}20`, color: TYPE_COLORS[p.activity.type] }}>
                          {ACTIVITY_TYPES.find((t) => t.value === p.activity.type)?.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.activity.title}</p>
                          <p className="text-xs text-gray-500">by {p.activity.creator.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No activities yet. Join one from the map!</p>
                )}
              </div>

              <div className="mt-8">
                <button onClick={logout} className="w-full py-3 border-2 border-red-400 rounded-xl text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-colors">
                  Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
