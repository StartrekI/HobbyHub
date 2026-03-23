"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
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

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { setUser, setUserLocation, setOnboarded } = useStore();

  const next = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();

      if (!res.ok || !data.id) {
        setLoginError(data.error || "Login failed. Please try again.");
        return;
      }

      // Save credential for session persistence
      localStorage.setItem("hobbyhub_token", response.credential);
      localStorage.setItem("hobbyhub_user", JSON.stringify(data));

      // Set user data from Google
      setName(data.name || "");
      setAvatar(data.avatar || "");
      setEmail(data.email || "");

      // If returning user with interests already set, skip to map
      const interests = typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests;
      if (interests && interests.length > 0) {
        setUser({
          ...data,
          interests,
          skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills || [],
        });
        setUserLocation({ lat: data.lat || 0, lng: data.lng || 0 });
        setOnboarded(true);
        return;
      }

      // New user — continue onboarding
      next();
    } catch (e) {
      console.error("Google auth error:", e);
      setLoginError("Network error. Please check your connection.");
    } finally {
      setLoginLoading(false);
    }
  }, [setUser, setUserLocation, setOnboarded]);

  // Initialize Google Sign-In
  useEffect(() => {
    if (step !== "google-login") return;
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
        });
      }
    };

    // Google script might already be loaded
    if (window.google) {
      initGoogle();
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step, handleGoogleResponse]);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("hobbyhub_user");
    if (savedUser) {
      try {
        const data = JSON.parse(savedUser);
        if (data.id && data.email) {
          // Verify session is still valid by pinging the server
          fetch("/api/users/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.id, lat: data.lat || 0, lng: data.lng || 0 }),
          }).then(res => {
            if (res.ok) {
              setUser({
                ...data,
                interests: typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests || [],
                skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills || [],
              });
              setUserLocation({ lat: data.lat || 0, lng: data.lng || 0 });
              setOnboarded(true);
            } else {
              localStorage.removeItem("hobbyhub_user");
              localStorage.removeItem("hobbyhub_token");
            }
          }).catch(() => {
            // Offline — still load cached user
            setUser({
              ...data,
              interests: typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests || [],
              skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills || [],
            });
            setUserLocation({ lat: data.lat || 0, lng: data.lng || 0 });
            setOnboarded(true);
          });
        }
      } catch {
        localStorage.removeItem("hobbyhub_user");
      }
    }
  }, [setUser, setUserLocation, setOnboarded]);

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
        const userData = {
          ...data,
          interests: typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests,
          skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills,
        };
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

              {/* Google Sign-In Button */}
              {GOOGLE_CLIENT_ID && (
                <div className="flex justify-center mb-4">
                  <div ref={googleBtnRef} />
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/30" />
                <span className="text-white/50 text-xs">{GOOGLE_CLIENT_ID ? "or continue with email" : "Sign in with email"}</span>
                <div className="flex-1 h-px bg-white/30" />
              </div>

              {/* Email login - always available */}
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
                  onClick={async () => {
                    if (!email) { setLoginError("Please enter your email"); return; }
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
                        setAvatar(data.avatar || "");
                        const interests = typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests;
                        if (interests && interests.length > 0) {
                          setUser({
                            ...data,
                            interests,
                            skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills || [],
                          });
                          setOnboarded(true);
                          return;
                        }
                        next();
                      } else {
                        setLoginError(data.error || "Failed to sign in");
                      }
                    } catch {
                      setLoginError("Network error. Please try again.");
                    } finally {
                      setLoginLoading(false);
                    }
                  }}
                  disabled={loginLoading}
                  className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  Continue
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
