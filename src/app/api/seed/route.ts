import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function nearby(center: { lat: number; lng: number }, spread = 0.015) {
  return {
    lat: center.lat + (Math.random() - 0.5) * spread,
    lng: center.lng + (Math.random() - 0.5) * spread,
  };
}
function futureDate(minH = 1, maxH = 96) {
  return new Date(Date.now() + (minH + Math.random() * (maxH - minH)) * 3600000);
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

const NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vihaan", "Ishita", "Arjun", "Diya",
  "Kabir", "Meera", "Aditya", "Sanya", "Reyansh", "Kiara", "Shaurya", "Riya",
  "Vivaan", "Aisha", "Dev", "Nisha", "Aryan", "Tara", "Karan", "Pooja",
  "Yash", "Sneha", "Rahul", "Kavya", "Nikhil", "Sara", "Pranav", "Aditi",
  "Siddharth", "Neha", "Harsh", "Divya", "Manish", "Ritika", "Varun", "Lakshmi",
];

const BIOS = [
  "Startup enthusiast, love building things", "Weekend warrior & fitness freak",
  "Photographer by passion, developer by profession", "Always up for an adventure!",
  "Coffee addict & code ninja", "Music lover & travel junkie",
  "Design thinking practitioner", "AI/ML researcher at heart",
  "Looking to connect with like-minded people", "Sports fanatic, play everything!",
  "Foodie exploring every cuisine", "Yoga practitioner & mindfulness coach",
  "Serial entrepreneur, 3rd startup", "Open source contributor",
  "Guitar player, jam anytime!", "Digital nomad lifestyle",
  "Bookworm & tea lover", "Sketch artist & UI designer",
];

const INTEREST_POOL = [
  "badminton", "cricket", "football", "basketball", "tennis", "cycling",
  "running", "yoga", "gym", "swimming", "hiking", "photography",
  "music", "gaming", "cooking", "travel", "reading", "art", "dance", "coding",
];

const ROLES = ["founder", "developer", "designer", "marketer", "student", "freelancer", "investor"];
const STAGES = ["idea", "building", "scaling", "established", ""];
const COMPANIES = [
  "NexGen AI", "PixelCraft Studios", "FreshBites", "EduTech Labs", "GreenRoute",
  "CloudNine Dev", "HealthFirst", "SocialSpark", "DataDriven Co", "InnovateLab", "", "",
];
const TITLES = [
  "CEO & Founder", "Full Stack Dev", "UI/UX Lead", "ML Engineer",
  "Product Designer", "Backend Dev", "Data Scientist", "Flutter Dev",
  "DevOps Lead", "Student", "Freelancer", "Content Creator",
];
const LOOKING_FOR = ["cofounder", "hiring", "networking", "mentor", "collaborator", "investor"];
const SKILL_POOL = [
  "React", "Node.js", "Python", "Flutter", "Swift",
  "ML/AI", "Design", "Marketing", "Sales", "DevOps", "Data Science", "Product",
];

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    if (lat === 0 || lng === 0) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    }

    const CENTER = { lat, lng };

    // Clean existing seed data (skip real users' data)
    await prisma.ideaComment.deleteMany();
    await prisma.idea.deleteMany();
    await prisma.tripParticipant.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.gigApplication.deleteMany();
    await prisma.gig.deleteMany();
    await prisma.skillSession.deleteMany();
    await prisma.connection.deleteMany();
    await prisma.business.deleteMany();
    await prisma.directMessage.deleteMany();
    await prisma.profileRequest.deleteMany();
    await prisma.block.deleteMany();
    await prisma.report.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.user.deleteMany({ where: { email: { endsWith: "@seed.hobbyhub.app" } } });

    // ─── 40 NEARBY USERS ───
    const users = [];
    for (let i = 0; i < 40; i++) {
      const loc = nearby(CENTER, 0.025);
      const name = NAMES[i % NAMES.length];
      const user = await prisma.user.create({
        data: {
          name,
          email: `${name.toLowerCase()}${i}@seed.hobbyhub.app`,
          bio: BIOS[i % BIOS.length],
          interests: JSON.stringify(pickN(INTEREST_POOL, 3 + Math.floor(Math.random() * 4))),
          lat: loc.lat, lng: loc.lng,
          online: Math.random() > 0.3,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          verified: Math.random() > 0.75,
          role: pick(ROLES),
          startupStage: pick(STAGES),
          company: pick(COMPANIES),
          title: pick(TITLES),
          lookingFor: pick(LOOKING_FOR),
          skills: JSON.stringify(pickN(SKILL_POOL, 2 + Math.floor(Math.random() * 4))),
          graduationYear: Math.random() > 0.5 ? 2019 + Math.floor(Math.random() * 7) : 0,
        },
      });
      users.push(user);
    }

    // ─── 30 ACTIVITIES ───
    const activityTemplates = [
      { type: "sports", title: "Badminton Doubles — All Levels Welcome!", desc: "Looking for 2 more players. Casual game, bring racket.", needed: 4, cat: "fitness" },
      { type: "sports", title: "Cricket Pickup Match 🏏", desc: "T20 style, 8-a-side. Need 3 more to fill the team.", needed: 8, cat: "fitness" },
      { type: "sports", title: "Football 5v5 Tonight ⚽", desc: "Intense 5v5. Bring boots, water, and energy!", needed: 10, cat: "fitness" },
      { type: "sports", title: "Basketball 3v3 Pickup", desc: "Half court, all levels. Starting in 1 hour.", needed: 6, cat: "fitness" },
      { type: "sports", title: "Tennis Rally Partner Wanted 🎾", desc: "Looking for someone to rally with this evening.", needed: 2, cat: "fitness" },
      { type: "fitness", title: "Morning 5K Run 🏃", desc: "Daily morning jog. All paces, no pressure.", needed: 15, cat: "fitness" },
      { type: "fitness", title: "Sunrise Yoga Outdoors 🧘", desc: "Free outdoor yoga session. Beginners welcome!", needed: 20, cat: "fitness" },
      { type: "fitness", title: "HIIT Group Session 💪", desc: "High intensity training. Bring a towel!", needed: 8, cat: "fitness" },
      { type: "fitness", title: "Cycling Group Ride 🚴", desc: "25km scenic route. Intermediate level.", needed: 10, cat: "fitness" },
      { type: "fitness", title: "Swimming Practice 🏊", desc: "Lane sharing at local pool. 6AM start.", needed: 5, cat: "fitness" },
      { type: "hangout", title: "Coffee & Startup Chat ☕", desc: "Chill hangout talking startups, ideas, and life.", needed: 5, cat: "social" },
      { type: "hangout", title: "Board Game Night 🎲", desc: "Catan, Codenames, and Wavelength! BYO snacks.", needed: 8, cat: "social" },
      { type: "hangout", title: "Weekend Brunch Crew 🍳", desc: "Great food and better conversations.", needed: 6, cat: "social" },
      { type: "food", title: "Street Food Exploration 🌮", desc: "Exploring the best local food spots together!", needed: 8, cat: "social" },
      { type: "food", title: "Cooking Together 👨‍🍳", desc: "Everyone makes a dish, everyone eats everything.", needed: 6, cat: "social" },
      { type: "photography", title: "Golden Hour Photowalk 📸", desc: "Capture the sunset. Camera or phone, both welcome.", needed: 10, cat: "social" },
      { type: "music", title: "Open Mic & Jam Session 🎸", desc: "Guitars, vocals, keyboards — all welcome.", needed: 8, cat: "social" },
      { type: "art", title: "Sketching in the Park 🎨", desc: "Plein air sketching. Any medium, any skill level.", needed: 8, cat: "social" },
      { type: "study", title: "LeetCode Grind Together 💻", desc: "Solving hard problems as a group. Bring laptop.", needed: 6, cat: "learning" },
      { type: "workshop", title: "React Workshop for Beginners", desc: "Build your first React app in 2 hours.", needed: 20, cat: "learning" },
      { type: "study", title: "Book Club: Atomic Habits", desc: "Discussing chapters 5–8 this Saturday.", needed: 8, cat: "learning" },
      { type: "workshop", title: "Figma Design Sprint ✏️", desc: "Design a mobile app UI in 3 hours together.", needed: 15, cat: "learning" },
      { type: "event", title: "Startup Pitch Night 🚀", desc: "5 startups pitch to investors. Free entry, pizza!", needed: 50, cat: "event", isEvent: true, price: 0 },
      { type: "event", title: "AI & the Future — Panel Talk", desc: "Speakers from top AI startups. Q&A + networking.", needed: 40, cat: "event", isEvent: true, price: 0 },
      { type: "event", title: "Indie Music Festival 🎵", desc: "Local bands, food stalls, incredible vibes.", needed: 100, cat: "event", isEvent: true, price: 200 },
      { type: "event", title: "Hackathon: Build in 24hrs ⚡", desc: "Teams of 4. Theme announced at start. Cash prizes!", needed: 60, cat: "event", isEvent: true, price: 0 },
      { type: "networking", title: "Founder Breakfast 🍳", desc: "Monthly meetup for founders. Share wins & struggles.", needed: 20, cat: "professional" },
      { type: "networking", title: "Designers Drinks Night 🎨", desc: "UI/UX designers over craft beer. Show your work!", needed: 15, cat: "professional" },
      { type: "travel", title: "Sunrise Hike This Weekend 🥾", desc: "Moderate trail, 3-hour hike. Carpooling available.", needed: 10, cat: "social" },
      { type: "gaming", title: "LAN Gaming Party 🎮", desc: "Valorant & Chess. Bring your setup or use ours.", needed: 8, cat: "social" },
    ];

    const chatPhrases = [
      "Count me in! 🙌", "What time exactly?", "Is this beginner friendly?",
      "On my way! 🏃", "Can I bring a friend?", "This sounds amazing!",
      "See you there! ⚡", "I'll be 10 mins late sorry", "Thanks for organizing this!",
      "Anyone carpooling from the city centre?", "What should I bring?",
      "Let's gooo! 🔥", "Saved the date!", "Who else is coming?",
      "Perfect, I've been looking for this!", "Super excited 👏",
    ];

    for (let i = 0; i < activityTemplates.length; i++) {
      const t = activityTemplates[i];
      const creator = users[i % users.length];
      const loc = nearby(CENTER, 0.02);
      const time = futureDate(1, 96);

      const activity = await prisma.activity.create({
        data: {
          type: t.type, title: t.title, description: t.desc,
          lat: loc.lat, lng: loc.lng, time,
          playersNeeded: t.needed, creatorId: creator.id,
          category: t.cat,
          isEvent: !!(t as Record<string, unknown>).isEvent,
          ticketPrice: ((t as Record<string, unknown>).price as number) || 0,
          isFree: !((t as Record<string, unknown>).price),
          createdAt: new Date(Date.now() - Math.random() * 3600000 * 2),
        },
      });

      // Creator joins
      await prisma.participant.create({ data: { userId: creator.id, activityId: activity.id } });

      // Random participants
      const pCount = 1 + Math.floor(Math.random() * Math.min(t.needed - 1, 7));
      const shuffled = pickN(users, pCount + 2);
      for (const p of shuffled) {
        if (p.id === creator.id) continue;
        await prisma.participant.create({ data: { userId: p.id, activityId: activity.id } }).catch(() => {});
      }

      // Chat messages
      const msgCount = 2 + Math.floor(Math.random() * 7);
      for (let m = 0; m < msgCount; m++) {
        await prisma.message.create({
          data: {
            text: pick(chatPhrases),
            senderId: pick(shuffled).id,
            activityId: activity.id,
            createdAt: new Date(Date.now() - (msgCount - m) * 60000 * (1 + Math.random() * 15)),
          },
        });
      }
    }

    // ─── 10 SKILL SESSIONS ───
    const skillTemplates = [
      { skill: "Learn React from Scratch", desc: "Beginner-friendly. Build a real app!", type: "teaching", free: true, price: 0, schedule: "Sat 10AM" },
      { skill: "Python for Machine Learning", desc: "Hands-on ML with scikit-learn & pandas.", type: "teaching", free: false, price: 500, schedule: "Sun 2PM" },
      { skill: "UI/UX Design with Figma", desc: "Design thinking + hands-on practice.", type: "teaching", free: false, price: 300, schedule: "Sat 3PM" },
      { skill: "Guitar for Beginners 🎸", desc: "Acoustic fundamentals. Patient teacher!", type: "teaching", free: true, price: 0, schedule: "Evenings" },
      { skill: "Public Speaking & Confidence", desc: "Overcome stage fear in 4 sessions.", type: "teaching", free: true, price: 0, schedule: "Wed 6PM" },
      { skill: "Flutter Mobile Dev", desc: "Build cross-platform apps from scratch.", type: "teaching", free: false, price: 400, schedule: "Sun 11AM" },
      { skill: "Photography Basics 📷", desc: "Composition, lighting, editing workflow.", type: "teaching", free: true, price: 0, schedule: "Sat 5PM" },
      { skill: "Cooking Masterclass 🍳", desc: "Learn to cook 5 dishes this weekend.", type: "teaching", free: true, price: 0, schedule: "Sun 9AM" },
      { skill: "Looking for Kotlin Mentor", desc: "Beginner Android dev, need guidance.", type: "learning", free: false, price: 300, schedule: "Flexible" },
      { skill: "Yoga & Meditation 🧘", desc: "Daily morning practice guide. All levels.", type: "teaching", free: true, price: 0, schedule: "Daily 6AM" },
    ];

    for (let i = 0; i < skillTemplates.length; i++) {
      const s = skillTemplates[i];
      const loc = nearby(CENTER, 0.02);
      await prisma.skillSession.create({
        data: {
          skill: s.skill, description: s.desc, sessionType: s.type,
          isFree: s.free, price: s.price, schedule: s.schedule,
          lat: loc.lat, lng: loc.lng,
          teacherId: users[i % users.length].id,
        },
      });
    }

    // ─── 10 GIGS ───
    const gigTemplates = [
      { title: "📸 Product Photographer Needed", desc: "E-commerce product shoot, 50 items. Own equipment.", budget: 5000, skills: ["Photography"] },
      { title: "React Developer — Fix Auth Bug", desc: "NextAuth.js session issue. Should be a quick fix.", budget: 3000, skills: ["React", "Node.js"] },
      { title: "Logo Design for New Cafe", desc: "Modern minimalist logo. Multiple revision rounds.", budget: 4000, skills: ["Design"] },
      { title: "Video Editor for YouTube Channel", desc: "Edit 3 vlogs per week consistently. Long-term gig.", budget: 8000, skills: ["Video"] },
      { title: "Content Writer — Tech Blog", desc: "5 long-form articles per month, SEO optimised.", budget: 6000, skills: ["Content", "SEO"] },
      { title: "Flutter App MVP Development", desc: "Food delivery app MVP needed in 2 weeks.", budget: 25000, skills: ["Flutter"] },
      { title: "Social Media Manager Wanted", desc: "Handle Instagram + Twitter for our startup.", budget: 10000, skills: ["Marketing", "Content"] },
      { title: "Data Dashboard in Streamlit", desc: "Build analytics dashboard from our CSV data.", budget: 7000, skills: ["Python", "Data Science"] },
      { title: "Background Score for Short Film", desc: "15-min indie film needs original music.", budget: 3500, skills: ["Video"] },
      { title: "Figma → Next.js Landing Page", desc: "Pixel-perfect conversion. Design files ready.", budget: 5000, skills: ["React", "Design"] },
    ];

    for (let i = 0; i < gigTemplates.length; i++) {
      const g = gigTemplates[i];
      const loc = nearby(CENTER, 0.02);
      const gig = await prisma.gig.create({
        data: {
          title: g.title, description: g.desc, budget: g.budget,
          skills: JSON.stringify(g.skills),
          deadline: new Date(Date.now() + (3 + i * 2) * 86400000).toISOString().split("T")[0],
          lat: loc.lat, lng: loc.lng,
          creatorId: users[i % users.length].id,
          createdAt: new Date(Date.now() - Math.random() * 3600000 * 1.5),
        },
      });
      const appCount = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < appCount; j++) {
        await prisma.gigApplication.create({
          data: {
            gigId: gig.id,
            userId: users[(i + j + 5) % users.length].id,
            message: pick(["Interested! Check my portfolio.", "Available immediately.", "I can do this, let's chat."]),
          },
        }).catch(() => {});
      }
    }

    // ─── 8 TRIPS ───
    const tripTemplates = [
      { dest: "Goa 🏖️", desc: "Beach, parties, seafood — 3 epic days!", type: "beach", budget: "8000–12000", max: 6 },
      { dest: "Sunrise Hill Trek", desc: "Leave at 3AM, watch the sun rise above the clouds.", type: "trekking", budget: "500–1000", max: 10 },
      { dest: "Coffee Plantation Trail ☕", desc: "Waterfalls, coffee estates, cozy homestay.", type: "weekend", budget: "5000–8000", max: 4 },
      { dest: "Heritage City Road Trip 🏛️", desc: "2 days exploring ruins, bouldering, local food.", type: "cultural", budget: "4000–6000", max: 6 },
      { dest: "Coastal Road Trip 🚗", desc: "Seafood, beaches, hidden coves. Epic route!", type: "road_trip", budget: "6000–10000", max: 4 },
      { dest: "Mountain Camp & Trek 🏔️", desc: "Camping under stars. Moderate difficulty trek.", type: "adventure", budget: "3000–5000", max: 8 },
      { dest: "Hill Station Weekend 🌅", desc: "Misty hills, tea gardens, and fresh air.", type: "weekend", budget: "4000–7000", max: 5 },
      { dest: "Epic Bike Trip 🏍️", desc: "10-day motorcycle adventure. Planning phase.", type: "adventure", budget: "25000–35000", max: 6 },
    ];

    for (let i = 0; i < tripTemplates.length; i++) {
      const t = tripTemplates[i];
      const loc = nearby(CENTER, 0.02);
      const trip = await prisma.trip.create({
        data: {
          destination: t.dest, description: t.desc, tripType: t.type,
          budget: t.budget, maxBuddies: t.max,
          startDate: new Date(Date.now() + (2 + i * 3) * 86400000).toISOString().split("T")[0],
          endDate: new Date(Date.now() + (4 + i * 3) * 86400000).toISOString().split("T")[0],
          lat: loc.lat, lng: loc.lng,
          creatorId: users[i % users.length].id,
          createdAt: new Date(Date.now() - Math.random() * 3600000),
        },
      });
      const pCount = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < pCount; j++) {
        await prisma.tripParticipant.create({
          data: { tripId: trip.id, userId: users[(i + j + 10) % users.length].id },
        }).catch(() => {});
      }
    }

    // ─── 8 IDEAS ───
    const ideaTemplates = [
      { title: "AI Recipe Generator 🤖", desc: "Scan your fridge, get personalised recipes with nutritional breakdown.", cat: "tech", stage: "concept", looking: "Developer, Designer" },
      { title: "Local Delivery Co-op", desc: "Community-owned hyperlocal delivery. No platform fees, fair wages.", cat: "social", stage: "validating", looking: "Co-founder, Operations" },
      { title: "Campus Event Discovery App", desc: "Tinder-style swipe for campus events. Never miss cool happenings.", cat: "education", stage: "building", looking: "Flutter Dev" },
      { title: "Sustainable Fashion Swap", desc: "Swap clothes locally instead of buying new. Save money and the planet.", cat: "business", stage: "concept", looking: "Marketing, Design" },
      { title: "Real-time Co-working Seat Finder", desc: "Find open seats at cafes and co-working spaces right now.", cat: "tech", stage: "validating", looking: "React Dev" },
      { title: "Neighbourhood Safety Network", desc: "Report issues, track safety, alert your neighbours instantly.", cat: "social", stage: "concept", looking: "Backend Dev" },
      { title: "Pet Playdate Matcher 🐕", desc: "Match dog owners for nearby playdates. Tinder for dogs!", cat: "creative", stage: "building", looking: "Flutter Dev, Designer" },
      { title: "Micro-Mentorship Platform", desc: "15-minute mentorship calls with industry experts. Pay per session.", cat: "business", stage: "launched", looking: "Marketing, Sales" },
    ];

    const commentTexts = [
      "Love this idea! 🔥", "Would definitely use this.", "Have you validated the market yet?",
      "I can help with the tech side!", "What's the revenue model?",
      "Let's chat about this over coffee!", "Sharing this with my network.",
      "This is exactly what's missing in the market!", "Invested in something similar — let's talk.",
    ];

    for (let i = 0; i < ideaTemplates.length; i++) {
      const idea = ideaTemplates[i];
      const loc = nearby(CENTER, 0.02);
      const created = await prisma.idea.create({
        data: {
          title: idea.title, description: idea.desc,
          category: idea.cat, stage: idea.stage, lookingFor: idea.looking,
          likes: 5 + Math.floor(Math.random() * 45),
          lat: loc.lat, lng: loc.lng,
          creatorId: users[i % users.length].id,
          createdAt: new Date(Date.now() - Math.random() * 3600000 * 1.5),
        },
      });
      const cCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < cCount; j++) {
        await prisma.ideaComment.create({
          data: {
            text: pick(commentTexts),
            ideaId: created.id,
            userId: users[(i + j + 3) % users.length].id,
            createdAt: new Date(Date.now() - Math.random() * 86400000 * 2),
          },
        });
      }
    }

    // ─── 5 BUSINESSES ───
    const businesses = [
      { name: "Third Wave Coffee ☕", desc: "Specialty coffee roasters & cozy workspace", cat: "cafe", rating: 4.6 },
      { name: "The Sports Hub", desc: "Multi-sport facility: courts, turf, pool", cat: "sports", rating: 4.3 },
      { name: "Cowork Central", desc: "Hot desks, fast wifi, great community", cat: "coworking", rating: 4.5 },
      { name: "Canvas & Co Art Studio", desc: "Art supplies, workshops, exhibition space", cat: "studio", rating: 4.7 },
      { name: "FitZone Gym 💪", desc: "24/7 gym with CrossFit and yoga studio", cat: "gym", rating: 4.2 },
    ];

    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];
      const loc = nearby(CENTER, 0.012);
      await prisma.business.create({
        data: {
          name: b.name, description: b.desc, category: b.cat,
          address: "Nearby", rating: b.rating,
          lat: loc.lat, lng: loc.lng,
          phone: "+1 555-000-" + String(1000 + i),
          hours: "8AM–10PM",
          ownerId: users[i].id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded near (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      counts: {
        users: users.length,
        activities: activityTemplates.length,
        skills: skillTemplates.length,
        gigs: gigTemplates.length,
        trips: tripTemplates.length,
        ideas: ideaTemplates.length,
        businesses: businesses.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
