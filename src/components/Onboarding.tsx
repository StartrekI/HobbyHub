"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Zap,
  Locate,
  Briefcase,
  Check,
  Shield,
  Mail,
  User,
  AtSign,
  Apple,
  LogIn,
  FileText,
} from "lucide-react";
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

/* ------------------------------------------------------------------ */
/* SVG icon helpers                                                    */
/* ------------------------------------------------------------------ */

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="size-5" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Social login buttons strip (shared between welcome/google-login)    */
/* ------------------------------------------------------------------ */

const SocialButtons = ({ onGoogleClick }: { onGoogleClick: () => void }) => (
  <div className="flex justify-center items-center gap-4">
    <button
      onClick={onGoogleClick}
      className="rounded-xl bg-white border border-zinc-200 flex justify-center items-center w-14 h-12 hover:bg-zinc-50 transition-colors"
    >
      <GoogleIcon />
    </button>
    <button className="rounded-xl bg-white border border-zinc-200 flex justify-center items-center w-14 h-12 hover:bg-zinc-50 transition-colors">
      <Apple className="size-5 text-zinc-950" />
    </button>
    <button className="rounded-xl bg-white border border-zinc-200 flex justify-center items-center w-14 h-12 hover:bg-zinc-50 transition-colors">
      <FacebookIcon />
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/* Gradient button style                                               */
/* ------------------------------------------------------------------ */

const gradientBtnStyle = {
  background: "linear-gradient(135deg, oklch(0.606 0.25 292.717), oklch(0.5 0.3 292.717))",
};

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await res.json();

      if (!googleUser.email) {
        setLoginError("Could not get email from Google. Please try again.");
        return;
      }

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

      let interests = data.interests || [];
      let skills = data.skills || [];
      try { if (typeof interests === "string") interests = JSON.parse(interests); } catch { interests = []; }
      try { if (typeof skills === "string") skills = JSON.parse(skills); } catch { skills = []; }
      setUser({ ...data, interests, skills });

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

  /* ---------------------------------------------------------------- */
  /* Framer motion variants                                            */
  /* ---------------------------------------------------------------- */

  const slideVariants = {
    enter: { y: 20, opacity: 0, filter: "blur(4px)" },
    center: { y: 0, opacity: 1, filter: "blur(0px)" },
    exit: { y: -20, opacity: 0, filter: "blur(4px)" },
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  };

  /* ---------------------------------------------------------------- */
  /* Step: WELCOME (sign-in page with hero)                            */
  /* ---------------------------------------------------------------- */

  const renderWelcome = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      {/* Hero section with purple overlay */}
      <div className="relative w-full h-64 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1758272959668-edd9114299c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBlbmpveWluZyUyMG91dGRvb3IlMjBhY3Rpdml0aWVzJTIwdG9nZXRoZXIlMjBtdXNpYyUyMGhpa2luZyUyMGNvbW11bml0eXxlbnwxfDB8fHwxNzc0ODg2NjcxfDA&ixlib=rb-4.1.0&q=80&w=400"
          alt="People enjoying outdoor activities together"
          className="object-cover w-full h-full"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, oklch(0.606 0.25 292.717 / 0.75), oklch(0.606 0.25 292.717 / 0.9))",
          }}
        />
        <div className="flex absolute inset-0 flex-col justify-center items-center gap-4">
          <div className="backdrop-blur-sm rounded-full bg-white/20 border border-white/30 flex justify-center items-center w-18 h-18">
            <div className="rounded-full bg-white/25 flex justify-center items-center w-14 h-14">
              <Zap className="size-8 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-bold text-white text-[28px] tracking-wide">Vibe</span>
          <span className="font-medium text-white/80 text-[13px]">
            Connect &middot; Explore &middot; Experience
          </span>
        </div>
      </div>

      {/* Sign-in form */}
      <div className="flex px-8 pt-8 pb-6 flex-col gap-6">
        <motion.div variants={fadeUp} className="text-center flex flex-col items-center gap-2">
          <h1 className="font-bold text-zinc-950 text-[22px]">Welcome Back!</h1>
          <p className="leading-relaxed text-[#71717b] text-[13px]">
            Sign in to discover what&apos;s happening around you
          </p>
        </motion.div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
          >
            {loginError}
          </motion.div>
        )}

        {loginLoading && (
          <div className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-zinc-200 border-t-[#8e51ff] rounded-full animate-spin" />
            <span className="text-[#71717b] text-sm">Signing in...</span>
          </div>
        )}

        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <Mail className="size-[18px] text-[#71717b]" />
            <input
              type="email"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <User className="size-[18px] text-[#71717b]" />
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
        </motion.div>

        <motion.button
          variants={fadeUp}
          onClick={handleEmailLogin}
          disabled={loginLoading}
          className="font-semibold rounded-xl text-violet-50 text-[15px] py-3 w-full h-12 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          style={gradientBtnStyle}
        >
          <LogIn className="size-4" />
          Sign In
        </motion.button>

        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <div className="bg-zinc-200 flex-1 h-px" />
          <span className="whitespace-nowrap text-[#71717b] text-xs">Or continue with</span>
          <div className="bg-zinc-200 flex-1 h-px" />
        </motion.div>

        <motion.div variants={fadeUp}>
          <SocialButtons onGoogleClick={handleGoogleClick} />
        </motion.div>

        {!GOOGLE_CLIENT_ID && !googleReady && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Google Sign-In not configured. Use email above.
          </div>
        )}

        <motion.div variants={fadeUp} className="flex pt-2 justify-center items-center gap-1">
          <span className="text-[#71717b] text-[13px]">Don&apos;t have an account?</span>
          <button onClick={next} className="font-semibold text-[#8e51ff] text-[13px]">
            Sign Up
          </button>
        </motion.div>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /* Step: GOOGLE-LOGIN (same layout, Google-focused)                  */
  /* ---------------------------------------------------------------- */

  const renderGoogleLogin = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      {/* Hero section */}
      <div className="relative w-full h-52 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1758272959668-edd9114299c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBlbmpveWluZyUyMG91dGRvb3IlMjBhY3Rpdml0aWVzJTIwdG9nZXRoZXIlMjBtdXNpYyUyMGhpa2luZyUyMGNvbW11bml0eXxlbnwxfDB8fHwxNzc0ODg2NjcxfDA&ixlib=rb-4.1.0&q=80&w=400"
          alt="People enjoying outdoor activities together"
          className="object-cover w-full h-full"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, oklch(0.606 0.25 292.717 / 0.75), oklch(0.606 0.25 292.717 / 0.9))",
          }}
        />
        <div className="flex absolute inset-0 flex-col justify-center items-center gap-3">
          <div className="backdrop-blur-sm rounded-full bg-white/20 border border-white/30 flex justify-center items-center w-16 h-16">
            <div className="rounded-full bg-white/25 flex justify-center items-center w-12 h-12">
              <Zap className="size-7 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-bold text-white text-2xl tracking-wide">Vibe</span>
        </div>
      </div>

      <div className="flex px-8 pt-8 pb-6 flex-col gap-6">
        <motion.div variants={fadeUp} className="text-center flex flex-col items-center gap-2">
          <h1 className="font-bold text-zinc-950 text-[22px]">Welcome Back!</h1>
          <p className="leading-relaxed text-[#71717b] text-[13px]">
            Sign in to get started
          </p>
        </motion.div>

        {loginError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
          >
            {loginError}
          </motion.div>
        )}

        {loginLoading && (
          <div className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-zinc-200 border-t-[#8e51ff] rounded-full animate-spin" />
            <span className="text-[#71717b] text-sm">Signing in...</span>
          </div>
        )}

        {GOOGLE_CLIENT_ID && (
          <motion.button
            variants={fadeUp}
            onClick={handleGoogleClick}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-zinc-200 text-zinc-950 rounded-xl font-semibold text-sm hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>
        )}

        {!GOOGLE_CLIENT_ID && !googleReady && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Google Sign-In not configured. Use email below.
          </div>
        )}

        <motion.div variants={fadeUp} className="flex items-center gap-4">
          <div className="bg-zinc-200 flex-1 h-px" />
          <span className="whitespace-nowrap text-[#71717b] text-xs">or</span>
          <div className="bg-zinc-200 flex-1 h-px" />
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <Mail className="size-[18px] text-[#71717b]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <User className="size-[18px] text-[#71717b]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
          <button
            onClick={handleEmailLogin}
            disabled={loginLoading}
            className="w-full py-3 rounded-xl font-semibold text-violet-50 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={gradientBtnStyle}
          >
            Continue with Email
          </button>
        </motion.div>

        <motion.p variants={fadeUp} className="text-[#71717b] text-xs text-center">
          By continuing, you agree to our Terms of Service
        </motion.p>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /* Step: PROFILE (profile-setup design)                              */
  /* ---------------------------------------------------------------- */

  const renderProfile = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <div className="flex px-6 pt-12 pb-8 flex-col items-center gap-6">
        {/* Vibe logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
          <div className="shadow-lg rounded-full bg-[#8e51ff] flex justify-center items-center w-16 h-16">
            <Zap className="size-8 text-violet-50" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-zinc-950 text-2xl leading-8 tracking-tight">Vibe</span>
          <span className="text-[#71717b] text-sm leading-5">Connect through what you love</span>
        </motion.div>

        {/* Avatar preview */}
        <motion.div variants={fadeUp}>
          {avatar ? (
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8e51ff] to-[#6c3ce7] p-[3px]">
                <img src={avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8e51ff] to-[#6c3ce7] p-[3px]">
                <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center text-2xl font-bold text-[#8e51ff]">
                  {name?.[0]?.toUpperCase() || "?"}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Form heading */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4 w-full">
          <h2 className="font-bold text-zinc-950 text-xl leading-7">Your Profile</h2>

          <div className="flex flex-col gap-3 w-full">
            <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
              <User className="size-4 text-[#71717b]" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent outline-none text-zinc-950 text-sm leading-5 flex-1 placeholder:text-zinc-400"
              />
            </div>
            <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
              <Mail className="size-4 text-[#71717b]" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent outline-none text-zinc-950 text-sm leading-5 flex-1 placeholder:text-zinc-400"
              />
            </div>
            <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-start gap-2">
              <FileText className="size-4 text-[#71717b] mt-0.5" />
              <textarea
                placeholder="Short bio (optional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="bg-transparent outline-none text-zinc-950 text-sm leading-5 flex-1 placeholder:text-zinc-400 resize-none"
              />
            </div>
          </div>
        </motion.div>

        <motion.button
          variants={fadeUp}
          onClick={next}
          className="font-semibold rounded-xl text-violet-50 text-sm leading-5 py-3 w-full h-12 hover:opacity-90 transition-opacity"
          style={gradientBtnStyle}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /* Step: PROFESSIONAL                                                */
  /* ---------------------------------------------------------------- */

  const renderProfessional = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-h-[100vh] overflow-y-auto">
      <div className="flex px-6 pt-12 pb-8 flex-col items-center gap-5">
        {/* Vibe logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
          <div className="shadow-lg rounded-full bg-[#8e51ff] flex justify-center items-center w-14 h-14">
            <Zap className="size-7 text-violet-50" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-zinc-950 text-xl leading-7 tracking-tight">Vibe</span>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center">
          <h2 className="font-bold text-zinc-950 text-xl leading-7">Professional Info</h2>
          <p className="text-[#71717b] text-sm mt-1">Optional -- helps you network better</p>
        </motion.div>

        {/* Your Role */}
        <motion.div variants={fadeUp} className="w-full">
          <span className="font-semibold text-zinc-950 text-sm leading-5 mb-2 block">Your Role</span>
          <div className="flex flex-wrap gap-2">
            {USER_ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`font-medium rounded-full text-xs leading-4 flex px-3 py-1.5 items-center gap-1.5 transition-all ${
                  role === r.value
                    ? "bg-[#8e51ff] text-violet-50"
                    : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Startup Stage */}
        {role && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="w-full"
          >
            <span className="font-semibold text-zinc-950 text-sm leading-5 mb-2 block">Startup Stage</span>
            <div className="flex flex-wrap gap-2">
              {STARTUP_STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStartupStage(s.value)}
                  className={`font-medium rounded-full text-xs leading-4 flex px-3 py-1.5 items-center gap-1.5 transition-all ${
                    startupStage === s.value
                      ? "bg-[#8e51ff] text-violet-50"
                      : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Company & Title */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 w-full">
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <Briefcase className="size-4 text-[#71717b]" />
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <AtSign className="size-4 text-[#71717b]" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
        </motion.div>

        {/* Looking for */}
        <motion.div variants={fadeUp} className="w-full">
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <Users className="size-4 text-[#71717b]" />
            <input
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Looking for... (cofounder, hiring, etc.)"
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div variants={fadeUp} className="w-full">
          <span className="font-semibold text-zinc-950 text-sm leading-5 mb-2 block">Skills</span>
          <div className="flex flex-wrap gap-1.5">
            {PROFESSIONAL_SKILLS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSkill(s)}
                className={`font-medium rounded-full text-xs leading-4 px-3 py-1.5 transition-all ${
                  skills.includes(s)
                    ? "bg-[#8e51ff] text-violet-50"
                    : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* College */}
        <motion.div variants={fadeUp} className="grid grid-cols-[1fr_5rem] gap-3 w-full">
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
            <input
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="College (optional)"
              className="bg-transparent outline-none text-zinc-950 text-sm flex-1 placeholder:text-zinc-400"
            />
          </div>
          <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center">
            <input
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="Year"
              type="number"
              className="bg-transparent outline-none text-zinc-950 text-sm w-full placeholder:text-zinc-400"
            />
          </div>
        </motion.div>

        <motion.button
          variants={fadeUp}
          onClick={next}
          className="font-semibold rounded-xl text-violet-50 text-sm leading-5 py-3 w-full h-12 hover:opacity-90 transition-opacity"
          style={gradientBtnStyle}
        >
          Continue
        </motion.button>
        <motion.button
          variants={fadeUp}
          onClick={next}
          className="text-[#71717b] text-sm hover:text-zinc-950 transition-colors"
        >
          Skip for now
        </motion.button>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /* Step: INTERESTS (profile-setup pill design)                       */
  /* ---------------------------------------------------------------- */

  const renderInterests = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <div className="flex px-6 pt-12 pb-8 flex-col items-center gap-6">
        {/* Vibe logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
          <div className="shadow-lg rounded-full bg-[#8e51ff] flex justify-center items-center w-16 h-16">
            <Zap className="size-8 text-violet-50" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-zinc-950 text-2xl leading-8 tracking-tight">Vibe</span>
          <span className="text-[#71717b] text-sm leading-5">Connect through what you love</span>
        </motion.div>

        <motion.div variants={fadeUp} className="w-full">
          <h2 className="font-bold text-zinc-950 text-xl leading-7 mb-1">Select Your Interests</h2>
          <p className="text-[#71717b] text-sm mb-4">Pick at least 3 hobbies</p>

          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`font-medium rounded-full text-xs leading-4 flex px-3 py-1.5 items-center gap-1.5 transition-all ${
                    selected
                      ? "bg-[#8e51ff] text-violet-50"
                      : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-sm">{interest.icon}</span>
                  <span>{interest.label}</span>
                  {selected && <Check className="size-3 ml-0.5" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Terms checkbox */}
        <motion.div variants={fadeUp} className="flex items-start gap-2 w-full">
          <button
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`rounded-sm border-2 flex mt-0.5 justify-center items-center w-4 h-4 shrink-0 transition-colors ${
              agreedToTerms
                ? "bg-[#8e51ff] border-[#8e51ff]"
                : "bg-white border-zinc-300"
            }`}
          >
            {agreedToTerms && <Check className="size-2.5 text-violet-50" strokeWidth={3} />}
          </button>
          <span className="text-[#71717b] text-xs leading-4">
            I agree to the{" "}
            <span className="font-medium text-[#8e51ff]">Terms of Service</span>{" "}
            and{" "}
            <span className="font-medium text-[#8e51ff]">Privacy Policy</span>
          </span>
        </motion.div>

        <motion.button
          variants={fadeUp}
          onClick={next}
          disabled={selectedInterests.length < 3}
          className="shadow-lg font-semibold rounded-xl text-violet-50 text-sm leading-5 py-3 w-full h-12 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={gradientBtnStyle}
        >
          Continue
          <span className="ml-2 text-xs font-normal opacity-70">({selectedInterests.length} selected)</span>
        </motion.button>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /* Step: LOCATION                                                    */
  /* ---------------------------------------------------------------- */

  const renderLocation = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <div className="flex px-6 pt-12 pb-8 flex-col items-center gap-6">
        {/* Vibe logo */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-2">
          <div className="shadow-lg rounded-full bg-[#8e51ff] flex justify-center items-center w-16 h-16">
            <Zap className="size-8 text-violet-50" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-zinc-950 text-2xl leading-8 tracking-tight">Vibe</span>
        </motion.div>

        {/* Location pulse animation */}
        <motion.div variants={fadeUp} className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 rounded-full bg-[#8e51ff]/10 animate-ping" style={{ animationDuration: "2.5s" }} />
          <div className="absolute inset-2 rounded-full bg-[#8e51ff]/10" />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="relative w-full h-full rounded-full bg-[#8e51ff]/10 border border-[#8e51ff]/20 flex items-center justify-center"
          >
            <Locate size={44} className="text-[#8e51ff]" />
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="text-center">
          <h2 className="font-bold text-zinc-950 text-xl leading-7 mb-2">Enable Location</h2>
          <p className="text-[#71717b] text-sm max-w-xs mx-auto mb-3">
            Discover nearby activities and connect with people around you
          </p>
          <div className="flex items-center justify-center gap-2 text-[#71717b] text-xs">
            <Shield size={12} /> <span>Your location is only shared while you are active</span>
          </div>
        </motion.div>

        {onboardError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 w-full"
          >
            {onboardError}
          </motion.div>
        )}

        <motion.button
          variants={fadeUp}
          onClick={requestLocation}
          className="shadow-lg font-semibold rounded-xl text-violet-50 text-sm leading-5 py-3 w-full h-12 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={gradientBtnStyle}
        >
          <Locate size={18} /> Allow Location Access
        </motion.button>

        <motion.button
          variants={fadeUp}
          onClick={() => finishOnboarding(0, 0)}
          className="w-full py-3 bg-zinc-100 border border-zinc-200 text-[#71717b] rounded-xl text-sm hover:text-zinc-950 hover:border-zinc-300 transition-all"
        >
          Use default location
        </motion.button>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const renderStep = () => {
    switch (step) {
      case "welcome": return renderWelcome();
      case "google-login": return renderGoogleLogin();
      case "profile": return renderProfile();
      case "professional": return renderProfessional();
      case "interests": return renderInterests();
      case "location": return renderLocation();
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-start justify-center z-50 overflow-y-auto">
      <div className="w-full max-w-md min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
