"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Zap, Locate, Briefcase } from "lucide-react";
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
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-violet-600 to-indigo-400 flex items-center justify-center z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="w-full max-w-md px-6 text-white text-center"
        >
          {step === "welcome" && (
            <div>
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
                <MapPin size={48} />
              </div>
              <h1 className="text-4xl font-extrabold mb-2">HobbyHub</h1>
              <p className="text-white/80 mb-10">Turn your city into a live map of human activity</p>
              <div className="space-y-3 mb-10 text-left">
                {[
                  { icon: MapPin, text: "Discover activities nearby" },
                  { icon: Users, text: "Meet people with similar hobbies" },
                  { icon: Zap, text: "Join spontaneous plans instantly" },
                  { icon: Briefcase, text: "Network with founders & freelancers" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl px-4 py-3">
                    <Icon size={20} />
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>
              <button onClick={next} className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform">
                Get Started
              </button>
            </div>
          )}

          {step === "google-login" && (
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
              <p className="text-white/80 mb-6">Sign in to continue</p>

              {loginError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-300/50 rounded-xl text-sm">
                  {loginError}
                </div>
              )}

              {loginLoading && (
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              )}

              {/* Google Sign-In - Custom Button */}
              {GOOGLE_CLIENT_ID && (
                <button
                  onClick={handleGoogleClick}
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-gray-700 rounded-xl font-semibold text-base hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 mb-2"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>
              )}

              {!GOOGLE_CLIENT_ID && !googleReady && (
                <div className="mb-2 p-3 bg-yellow-500/20 border border-yellow-300/50 rounded-xl text-xs text-white/70">
                  Google Sign-In not configured. Use email below.
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/30" />
                <span className="text-white/50 text-xs">or continue with email</span>
                <div className="flex-1 h-px bg-white/30" />
              </div>

              {/* Email login */}
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/15 border-2 border-transparent focus:border-white/50 rounded-xl px-4 py-3 outline-none placeholder-white/50 text-white"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-white/15 border-2 border-transparent focus:border-white/50 rounded-xl px-4 py-3 outline-none placeholder-white/50 text-white"
                />
                <button
                  onClick={handleEmailLogin}
                  disabled={loginLoading}
                  className="w-full py-4 bg-white/20 border-2 border-white/40 text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  Continue with Email
                </button>
              </div>

              <p className="text-white/50 text-xs mt-4">
                By continuing, you agree to our Terms of Service
              </p>
            </div>
          )}

          {step === "profile" && (
            <div>
              <h2 className="text-3xl font-bold mb-2">Set Up Profile</h2>
              <p className="text-white/80 mb-6">Tell us about yourself</p>
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-white/50 object-cover" />
              ) : (
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 border-2 border-dashed border-white/50 flex items-center justify-center text-2xl font-bold">
                  {name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full bg-white/15 border-2 border-transparent focus:border-white/50 rounded-xl px-4 py-3 mb-3 outline-none placeholder-white/50" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (optional)" rows={2}
                className="w-full bg-white/15 border-2 border-transparent focus:border-white/50 rounded-xl px-4 py-3 mb-6 outline-none placeholder-white/50 resize-none" />
              <button onClick={next} className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform">
                Continue
              </button>
            </div>
          )}

          {step === "professional" && (
            <div className="max-h-[70vh] overflow-y-auto">
              <h2 className="text-3xl font-bold mb-2">Professional Info</h2>
              <p className="text-white/80 mb-4">Optional - helps you network better</p>

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1 block">Your Role</label>
                  <div className="flex flex-wrap gap-2">
                    {USER_ROLES.map((r) => (
                      <button key={r.value} onClick={() => setRole(r.value)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${role === r.value ? "bg-white text-violet-600 font-semibold" : "bg-white/15 border border-white/30"}`}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {role && (
                  <div>
                    <label className="text-xs font-semibold text-white/70 mb-1 block">Startup Stage</label>
                    <div className="flex flex-wrap gap-2">
                      {STARTUP_STAGES.map((s) => (
                        <button key={s.value} onClick={() => setStartupStage(s.value)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${startupStage === s.value ? "bg-white text-violet-600 font-semibold" : "bg-white/15 border border-white/30"}`}>
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company"
                    className="flex-1 bg-white/15 border border-white/30 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-white/50" />
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
                    className="flex-1 bg-white/15 border border-white/30 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-white/50" />
                </div>

                <input value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Looking for... (cofounder, hiring, etc.)"
                  className="w-full bg-white/15 border border-white/30 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-white/50" />

                <div>
                  <label className="text-xs font-semibold text-white/70 mb-1 block">Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROFESSIONAL_SKILLS.map((s) => (
                      <button key={s} onClick={() => toggleSkill(s)}
                        className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${skills.includes(s) ? "bg-white text-violet-600 font-semibold" : "bg-white/15 border border-white/30"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="College (optional)"
                    className="flex-1 bg-white/15 border border-white/30 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-white/50" />
                  <input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="Year" type="number"
                    className="w-20 bg-white/15 border border-white/30 rounded-xl px-3 py-2.5 text-sm outline-none placeholder-white/50" />
                </div>
              </div>

              <button onClick={next} className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mt-6">
                Continue
              </button>
              <button onClick={next} className="text-white/60 text-sm hover:text-white/80 transition-colors mt-2">
                Skip for now
              </button>
            </div>
          )}

          {step === "interests" && (
            <div>
              <h2 className="text-3xl font-bold mb-2">Pick Your Interests</h2>
              <p className="text-white/80 mb-6">Select at least 3 hobbies</p>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`px-4 py-2 rounded-full border-2 text-sm transition-all ${
                      selectedInterests.includes(interest.id)
                        ? "bg-white text-violet-600 border-white font-semibold scale-105"
                        : "bg-white/15 border-white/30 hover:scale-105"
                    }`}
                  >
                    {interest.icon} {interest.label}
                  </button>
                ))}
              </div>
              <button onClick={next} disabled={selectedInterests.length < 3}
                className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                Continue ({selectedInterests.length} selected)
              </button>
            </div>
          )}

          {step === "location" && (
            <div>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Locate size={80} className="mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl font-bold mb-2">Enable Location</h2>
              <p className="text-white/80 mb-8">HobbyHub needs your location to show nearby activities and people</p>
              {onboardError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-300/50 rounded-xl text-sm text-white">
                  {onboardError}
                </div>
              )}
              <button onClick={requestLocation} className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform mb-3">
                Allow Location Access
              </button>
              <button onClick={() => finishOnboarding(0, 0)} className="text-white/60 text-sm hover:text-white/80 transition-colors">
                Use default location
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
