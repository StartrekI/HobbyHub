"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Zap, Camera, Locate, Briefcase } from "lucide-react";
import { useStore } from "@/store";
import { INTERESTS, USER_ROLES, STARTUP_STAGES, PROFESSIONAL_SKILLS } from "@/lib/utils";

const steps = ["welcome", "login", "profile", "professional", "interests", "location"] as const;
type Step = (typeof steps)[number];

export default function Onboarding() {
  const [step, setStep] = useState<Step>("welcome");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  // Professional fields
  const [role, setRole] = useState("");
  const [startupStage, setStartupStage] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [collegeName, setCollegeName] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setUser, setUserLocation, setOnboarded } = useStore();

  const next = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const handleOtp = () => {
    if (!otpSent) {
      if (phone.length < 10) return;
      setOtpSent(true);
      setTimeout(() => setOtp(["1", "2", "3", "4"]), 500);
    } else {
      next();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

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
          finishOnboarding();
        },
        () => finishOnboarding()
      );
    } else {
      finishOnboarding();
    }
  };

  const [onboardError, setOnboardError] = useState("");

  const finishOnboarding = async () => {
    const loc = useStore.getState().userLocation;
    setOnboardError("");

    // Retry up to 3 times
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || "Explorer",
            phone: phone || "9999999999",
            bio,
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
          setUser({
            ...data,
            interests: typeof data.interests === "string" ? JSON.parse(data.interests) : data.interests,
            skills: typeof data.skills === "string" ? JSON.parse(data.skills) : data.skills,
          });
          setOnboarded(true);
          return;
        }
        // If response not ok, try again
        console.error("User creation failed:", data);
      } catch (e) {
        console.error("User creation attempt failed:", e);
      }
      // Wait before retrying
      await new Promise(r => setTimeout(r, 1000));
    }

    // All retries failed — show error instead of creating fake user
    setOnboardError("Could not connect to server. Please check your internet and try again.");
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

          {step === "login" && (
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
              <p className="text-white/80 mb-8">Enter your phone number to continue</p>
              <div className="flex items-center bg-white/15 backdrop-blur rounded-xl overflow-hidden mb-4 border-2 border-transparent focus-within:border-white/50">
                <span className="px-4 font-semibold">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Phone number"
                  className="flex-1 bg-transparent py-4 pr-4 outline-none text-white placeholder-white/50"
                />
              </div>
              {otpSent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-sm text-white/70 mb-3">Enter OTP sent to your number</p>
                  <div className="flex gap-3 justify-center mb-6">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="w-14 h-14 text-center text-xl font-bold bg-white/15 border-2 border-white/30 rounded-xl outline-none focus:border-white transition-colors"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <button onClick={handleOtp} className="w-full py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform">
                {otpSent ? "Verify OTP" : "Send OTP"}
              </button>
            </div>
          )}

          {step === "profile" && (
            <div>
              <h2 className="text-3xl font-bold mb-2">Set Up Profile</h2>
              <p className="text-white/80 mb-6">Tell us about yourself</p>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 border-2 border-dashed border-white/50 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                <Camera size={28} />
              </div>
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
              <button onClick={finishOnboarding} className="text-white/60 text-sm hover:text-white/80 transition-colors">
                Use default location
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
