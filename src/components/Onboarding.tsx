"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Zap, Locate, Briefcase, Check, ChevronRight, Shield, Sparkles } from "lucide-react";
import { useStore } from "@/store";
import { INTERESTS, USER_ROLES, STARTUP_STAGES, PROFESSIONAL_SKILLS } from "@/lib/utils";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const steps = ["welcome", "google-login", "profile", "professional", "interests", "location"] as const;
type Step = (typeof steps)[number];

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: Record<string, unknown>) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export default function Onboarding() {
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [startupStage, setStartupStage] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [collegeName, setCollegeName] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [onboardError, setOnboardError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);

  const { setUser, setUserLocation, setOnboarded } = useStore();

  const next = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  // Process Google user info from access token
  const processGoogleLogin = useCallback(async (accessToken: string) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      // Fetch user info from Google using access token
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await res.json();

      if (!googleUser.email) {
        setLoginError("Could not get email from Google. Please try again.");
        return;
      }

      // Create/update user in our DB
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name || "Explorer",
          avatar: googleUser.picture || "",
        }),
      });
      const data = await userRes.json();

      if (!userRes.ok || !data.id) {
        setLoginError(data.error || data.details || "Login failed. Please try again.");
        console.error("User creation failed:", data);
        return;
      }

      localStorage.setItem("hobbyhub_user", JSON.stringify(data));

      // Set user and go straight to map
      let interests = data.interests || [];
      let skills = data.skills || [];
      try { if (typeof interests === "string") interests = JSON.parse(interests); } catch { interests = []; }
      try { if (typeof skills === "string") skills = JSON.parse(skills); } catch { skills = []; }
      setUser({ ...data, interests, skills });

      // Get location then finish
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            // Update user location in DB
            fetch("/api/users/ping", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
            }).catch(() => {});
            localStorage.setItem("hobbyhub_user", JSON.stringify({ ...data, lat: pos.coords.latitude, lng: pos.coords.longitude }));
            setOnboarded(true);
          },
          () => { setOnboarded(true); }
        );
      } else {
        setOnboarded(true);
      }
    } catch (e) {
      console.error("Google login error:", e);
      setLoginError("Network error. Please check your connection.");
    } finally {
      setLoginLoading(false);
    }
  }, [setUser, setUserLocation, setOnboarded]);

  // Wait for Google script to load
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGoogleReady(true);
        clearInterval(checkGoogle);
      }
    }, 200);

    return () => clearInterval(checkGoogle);
  }, []);

  const handleGoogleClick = () => {
    if (!window.google?.accounts?.oauth2) {
      setLoginError("Google Sign-In is loading... Please try again in a moment.");
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.error) {
          setLoginError("Google sign-in was cancelled or failed.");
          return;
        }
        if (response.access_token) {
          processGoogleLogin(response.access_token);
        }
      },
    });

    client.requestAccessToken();
  };

  // Email login handler
  const handleEmailLogin = async () => {
    if (!email) { setLoginError("Please enter your email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLoginError("Please enter a valid email address"); return; }
    if (!name) { setLoginError("Please enter your name"); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        localStorage.setItem("hobbyhub_user", JSON.stringify(data));
        let interests = data.interests || [];
        let skills = data.skills || [];
        try { if (typeof interests === "string") interests = JSON.parse(interests); } catch { interests = []; }
        try { if (typeof skills === "string") skills = JSON.parse(skills); } catch { skills = []; }
        setUser({ ...data, interests, skills });
        // Get location then go to map
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              fetch("/api/users/ping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: data.id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
              }).catch(() => {});
              localStorage.setItem("hobbyhub_user", JSON.stringify({ ...data, lat: pos.coords.latitude, lng: pos.coords.longitude }));
              setOnboarded(true);
            },
            () => { setOnboarded(true); }
          );
        } else {
          setOnboarded(true);
        }
      } else {
        setLoginError(data.error || "Failed to sign in");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Session restore is handled in page.tsx

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSkill = (s: string) => {
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          finishOnboarding(pos.coords.latitude, pos.coords.longitude);
        },
        () => finishOnboarding(0, 0)
      );
    } else {
      finishOnboarding(0, 0);
    }
  };

  const finishOnboarding = async (lat?: number, lng?: number) => {
    const loc = lat !== undefined ? { lat, lng: lng || 0 } : useStore.getState().userLocation;
    setOnboardError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Explorer",
          email,
          bio,
          avatar,
          interests: selectedInterests,
          role,
          startupStage,
          company,
          title,
          lookingFor,
          skills,
          collegeName,
          graduationYear: parseInt(graduationYear) || 0,
          lat: loc.lat,
          lng: loc.lng,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        let parsedInterests = data.interests || [];
        let parsedSkills = data.skills || [];
        try { if (typeof parsedInterests === "string") parsedInterests = JSON.parse(parsedInterests); } catch { parsedInterests = []; }
        try { if (typeof parsedSkills === "string") parsedSkills = JSON.parse(parsedSkills); } catch { parsedSkills = []; }
        const userData = { ...data, interests: parsedInterests, skills: parsedSkills };
        setUser(userData);
        localStorage.setItem("hobbyhub_user", JSON.stringify(data));
        setOnboarded(true);
        return;
      }
      setOnboardError(data.error || "Failed to save profile. Please try again.");
    } catch (e) {
      console.error("Finish onboarding error:", e);
      setOnboardError("Network error. Please check your connection and try again.");
    }
  };

  const slideVariants = {
    enter: { y: 20, opacity: 0, filter: "blur(4px)" },
    center: { y: 0, opacity: 1, filter: "blur(0px)" },
    exit: { y: -20, opacity: 0, filter: "blur(4px)" },
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <div className="fixed inset-0 bg-[#13132b] flex items-center justify-center z-50 overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#6c5ce7]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#a29bfe]/8 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md px-6 text-white text-center relative z-10"
        >
          {step === "welcome" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/25">
                <Sparkles size={36} className="text-white" />
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-white via-[#e8e5ff] to-[#a29bfe] bg-clip-text text-transparent">
                HobbyHub
              </motion.h1>
              <motion.p variants={fadeUp} className="text-[#9e9eb0] mb-10 text-base">
                Turn your city into a live map of human activity
              </motion.p>
              <motion.div variants={fadeUp} className="space-y-2.5 mb-10 text-left">
                {[
                  { icon: MapPin, text: "Discover activities nearby", color: "from-[#6c5ce7]/15 to-transparent" },
                  { icon: Users, text: "Meet people with similar hobbies", color: "from-[#a29bfe]/15 to-transparent" },
                  { icon: Zap, text: "Join spontaneous plans instantly", color: "from-[#6c5ce7]/12 to-transparent" },
                  { icon: Briefcase, text: "Network with founders & freelancers", color: "from-[#a29bfe]/12 to-transparent" },
                ].map(({ icon: Icon, text, color }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className={`flex items-center gap-3.5 bg-gradient-to-r ${color} border border-white/[0.06] rounded-xl px-4 py-3.5`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-[#a29bfe]" />
                    </div>
                    <span className="text-sm text-[#d1d1db]">{text}</span>
                  </motion.div>
                ))}
              </motion.div>
              <motion.button variants={fadeUp} onClick={next}
                className="w-full py-4 bg-[#6c5ce7] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-[#6c5ce7]/25 flex items-center justify-center gap-2">
                Get Started <ChevronRight size={20} />
              </motion.button>
            </motion.div>
          )}

          {step === "google-login" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-1.5">Welcome back</motion.h2>
              <motion.p variants={fadeUp} className="text-[#9e9eb0] mb-8">Sign in to get started</motion.p>

              {loginError && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-3.5 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl text-sm text-[#ff6b6b]">
                  {loginError}
                </motion.div>
              )}

              {loginLoading && (
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="w-5 h-5 border-2 border-white/[0.08] border-t-[#a29bfe] rounded-full animate-spin" />
                  <span className="text-[#9e9eb0]">Signing in...</span>
                </div>
              )}

              {GOOGLE_CLIENT_ID && (
                <motion.button variants={fadeUp} onClick={handleGoogleClick} disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-[#1a1a2e] rounded-2xl font-semibold text-base hover:scale-[1.02] hover:shadow-xl transition-all shadow-lg disabled:opacity-50 mb-3">
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </motion.button>
              )}

              {!GOOGLE_CLIENT_ID && !googleReady && (
                <div className="mb-3 p-3 bg-[#fdcb6e]/10 border border-[#fdcb6e]/20 rounded-xl text-xs text-[#fdcb6e]">
                  Google Sign-In not configured. Use email below.
                </div>
              )}

              <motion.div variants={fadeUp} className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <span className="text-[#6e6e82] text-xs uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              </motion.div>

              <motion.div variants={fadeUp} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
                  className="w-full bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-4 py-3 outline-none placeholder-[#6e6e82] text-white transition-colors" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  className="w-full bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-4 py-3 outline-none placeholder-[#6e6e82] text-white transition-colors" />
                <button onClick={handleEmailLogin} disabled={loginLoading}
                  className="w-full py-3.5 bg-[#6c5ce7] text-white rounded-xl font-semibold hover:scale-[1.02] transition-all disabled:opacity-50">
                  Continue with Email
                </button>
              </motion.div>

              <motion.p variants={fadeUp} className="text-[#4a4a5e] text-xs mt-5">
                By continuing, you agree to our Terms of Service
              </motion.p>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-1.5">Your Profile</motion.h2>
              <motion.p variants={fadeUp} className="text-[#9e9eb0] mb-8">Tell us about yourself</motion.p>
              <motion.div variants={fadeUp} className="mb-8">
                {avatar ? (
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] p-[3px]">
                      <img src={avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] p-[3px]">
                      <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center text-3xl font-bold text-[#a29bfe]">
                        {name?.[0]?.toUpperCase() || "?"}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
              <motion.div variants={fadeUp} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 space-y-3 mb-6">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                  className="w-full bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-4 py-3 outline-none placeholder-[#6e6e82] text-white transition-colors" />
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (optional)" rows={2}
                  className="w-full bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-4 py-3 outline-none placeholder-[#6e6e82] text-white resize-none transition-colors" />
              </motion.div>
              <motion.button variants={fadeUp} onClick={next}
                className="w-full py-4 bg-[#6c5ce7] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-[#6c5ce7]/20">
                Continue
              </motion.button>
            </motion.div>
          )}

          {step === "professional" && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-h-[75vh] overflow-y-auto scrollbar-none">
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-1.5">Professional Info</motion.h2>
              <motion.p variants={fadeUp} className="text-[#9e9eb0] mb-6">Optional -- helps you network better</motion.p>

              <div className="space-y-5 text-left">
                <motion.div variants={fadeUp} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                  <label className="text-xs font-semibold text-[#9e9eb0] uppercase tracking-wider mb-2.5 block">Your Role</label>
                  <div className="flex flex-wrap gap-2">
                    {USER_ROLES.map((r) => (
                      <button key={r.value} onClick={() => setRole(r.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${role === r.value ? "bg-[#6c5ce7] text-white font-semibold shadow-md shadow-[#6c5ce7]/30" : "bg-white/[0.06] border border-white/[0.08] text-[#d1d1db] hover:border-white/[0.15]"}`}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {role && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                    <label className="text-xs font-semibold text-[#9e9eb0] uppercase tracking-wider mb-2.5 block">Startup Stage</label>
                    <div className="flex flex-wrap gap-2">
                      {STARTUP_STAGES.map((s) => (
                        <button key={s.value} onClick={() => setStartupStage(s.value)}
                          className={`px-3.5 py-1.5 rounded-full text-xs transition-all ${startupStage === s.value ? "bg-[#6c5ce7] text-white font-semibold shadow-md shadow-[#6c5ce7]/30" : "bg-white/[0.06] border border-white/[0.08] text-[#d1d1db] hover:border-white/[0.15]"}`}>
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company"
                    className="bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder-[#6e6e82] text-white transition-colors" />
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                    className="bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder-[#6e6e82] text-white transition-colors" />
                </motion.div>

                <motion.input variants={fadeUp} value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Looking for... (cofounder, hiring, etc.)"
                  className="w-full bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder-[#6e6e82] text-white transition-colors" />

                <motion.div variants={fadeUp} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
                  <label className="text-xs font-semibold text-[#9e9eb0] uppercase tracking-wider mb-2.5 block">Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROFESSIONAL_SKILLS.map((s) => (
                      <button key={s} onClick={() => toggleSkill(s)}
                        className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${skills.includes(s) ? "bg-[#6c5ce7] text-white font-semibold" : "bg-white/[0.06] border border-white/[0.08] text-[#9e9eb0] hover:border-white/[0.15]"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="grid grid-cols-[1fr_5rem] gap-3">
                  <input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="College (optional)"
                    className="bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder-[#6e6e82] text-white transition-colors" />
                  <input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="Year" type="number"
                    className="bg-white/[0.06] border border-white/[0.08] focus:border-[#a29bfe]/50 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder-[#6e6e82] text-white transition-colors" />
                </motion.div>
              </div>

              <motion.button variants={fadeUp} onClick={next}
                className="w-full py-4 bg-[#6c5ce7] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-[#6c5ce7]/20 mt-6">
                Continue
              </motion.button>
              <motion.button variants={fadeUp} onClick={next} className="text-[#6e6e82] text-sm hover:text-[#d1d1db] transition-colors mt-3 block mx-auto">
                Skip for now
              </motion.button>
            </motion.div>
          )}

          {step === "interests" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-1.5">Pick Your Interests</motion.h2>
              <motion.p variants={fadeUp} className="text-[#9e9eb0] mb-6">Select at least 3 hobbies</motion.p>
              <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2 mb-8">
                {INTERESTS.map((interest) => {
                  const selected = selectedInterests.includes(interest.id);
                  return (
                    <button key={interest.id} onClick={() => toggleInterest(interest.id)}
                      className={`relative px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                        selected
                          ? "bg-[#6c5ce7]/20 border-[#6c5ce7]/50 border text-white font-medium"
                          : "bg-white/[0.04] border border-white/[0.06] text-[#d1d1db] hover:border-white/[0.15]"
                      }`}>
                      <span>{interest.icon} {interest.label}</span>
                      {selected && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#6c5ce7] rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
              <motion.button variants={fadeUp} onClick={next} disabled={selectedInterests.length < 3}
                className="w-full py-4 bg-[#6c5ce7] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-[#6c5ce7]/20 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed">
                Continue
                <span className="ml-2 text-sm font-normal opacity-70">({selectedInterests.length} selected)</span>
              </motion.button>
            </motion.div>
          )}

          {step === "location" && (
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-[#6c5ce7]/10 animate-ping" style={{ animationDuration: "2.5s" }} />
                <div className="absolute inset-2 rounded-full bg-[#6c5ce7]/10" />
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="relative w-full h-full rounded-full bg-gradient-to-br from-[#6c5ce7]/20 to-[#a29bfe]/20 border border-[#6c5ce7]/20 flex items-center justify-center">
                  <Locate size={44} className="text-[#a29bfe]" />
                </motion.div>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-2">Enable Location</motion.h2>
              <motion.p variants={fadeUp} className="text-[#9e9eb0] mb-4 max-w-xs mx-auto">
                Discover nearby activities and connect with people around you
              </motion.p>
              <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-[#6e6e82] text-xs mb-8">
                <Shield size={12} /> <span>Your location is only shared while you are active</span>
              </motion.div>
              {onboardError && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-3.5 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-xl text-sm text-[#ff6b6b]">
                  {onboardError}
                </motion.div>
              )}
              <motion.button variants={fadeUp} onClick={requestLocation}
                className="w-full py-4 bg-[#6c5ce7] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-[#6c5ce7]/20 mb-3 flex items-center justify-center gap-2">
                <Locate size={18} /> Allow Location Access
              </motion.button>
              <motion.button variants={fadeUp} onClick={() => finishOnboarding(0, 0)}
                className="w-full py-3 bg-white/[0.04] border border-white/[0.06] text-[#9e9eb0] rounded-2xl text-sm hover:text-[#d1d1db] hover:border-white/[0.15] transition-all">
                Use default location
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
