import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CENTER = { lat: 12.9716, lng: 77.5946 }; // Bangalore

function nearby(spread = 0.025) {
  return {
    lat: CENTER.lat + (Math.random() - 0.5) * spread,
    lng: CENTER.lng + (Math.random() - 0.5) * spread,
  };
}

function futureDate(minH = 1, maxH = 72) {
  return new Date(Date.now() + (minH + Math.random() * (maxH - minH)) * 3600000);
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const s = [...arr].sort(() => Math.random() - 0.5);
  return s.slice(0, n);
}

const NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vihaan", "Ishita", "Arjun", "Diya",
  "Kabir", "Meera", "Aditya", "Sanya", "Reyansh", "Kiara", "Shaurya", "Riya",
  "Vivaan", "Aisha", "Dev", "Nisha", "Aryan", "Tara", "Karan", "Pooja",
  "Yash", "Sneha", "Rahul", "Kavya", "Nikhil", "Sara", "Pranav", "Aditi",
  "Siddharth", "Neha", "Harsh", "Divya", "Manish", "Ritika", "Varun", "Lakshmi",
  "Akash", "Pallavi", "Dhruv", "Shruti", "Vikram", "Nandini", "Raj", "Tanvi",
  "Amit", "Swati",
];

const BIOS = [
  "Startup enthusiast, love building things", "Weekend warrior & fitness freak",
  "Photographer by passion, developer by profession", "Always up for an adventure!",
  "Coffee addict & code ninja", "Music lover & travel junkie",
  "Design thinking practitioner", "AI/ML researcher at heart",
  "Looking to connect with like-minded people", "Sports fanatic, play everything!",
  "Foodie exploring every cuisine", "Yoga practitioner & mindfulness coach",
  "Serial entrepreneur, 3rd startup", "Open source contributor",
  "Aspiring filmmaker", "Digital nomad lifestyle", "Bookworm & tea lover",
  "Guitar player, jam anytime!", "Sketch artist & UI designer", "Data nerd & visualization geek",
];

const INTEREST_POOL = [
  "badminton", "cricket", "football", "basketball", "tennis", "cycling",
  "running", "yoga", "gym", "swimming", "hiking", "photography",
  "music", "gaming", "cooking", "travel", "reading", "art", "dance", "coding",
];

const ROLES = ["founder", "developer", "designer", "marketer", "student", "freelancer", "investor", ""];
const STAGES = ["idea", "building", "scaling", "established", ""];
const COMPANIES = [
  "NexGen AI", "PixelCraft Studios", "FreshBites", "EduTech Labs", "GreenRoute",
  "CloudNine Dev", "HealthFirst", "CryptoWave", "SocialSpark", "DataDriven Co",
  "InnovateLab", "FreelanceHub", "", "", "", "",
];
const TITLES = [
  "CEO & Founder", "Full Stack Dev", "UI/UX Lead", "Growth Hacker", "ML Engineer",
  "Product Designer", "Backend Dev", "Data Scientist", "Content Creator",
  "Flutter Dev", "DevOps Lead", "Student", "Freelancer", "", "", "",
];
const LOOKING_FOR = ["cofounder", "hiring", "networking", "mentor", "collaborator", "investor", ""];
const SKILL_POOL = [
  "React", "Node.js", "Python", "Flutter", "Swift", "Kotlin",
  "ML/AI", "Design", "Marketing", "Sales", "Finance", "Operations",
  "DevOps", "Data Science", "Product", "Content", "SEO", "Video",
];
const COLLEGES = [
  "IIT Bangalore", "BITS Pilani", "VIT Vellore", "PES University", "RVCE",
  "NIT Surathkal", "Christ University", "BMS College", "MSRIT", "",  "", "", "",
];

async function main() {
  console.log("Clearing database...");
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
  await prisma.user.deleteMany();

  // ─── DEMO USER ───
  const demoUser = await prisma.user.create({
    data: {
      name: "You",
      email: "demo@hobbyhub.app",
      bio: "Explorer, builder, and hobby enthusiast",
      interests: JSON.stringify(["badminton", "photography", "coding", "travel", "music", "gaming"]),
      lat: CENTER.lat,
      lng: CENTER.lng,
      online: true,
      rating: 4.8,
      verified: true,
      role: "founder",
      startupStage: "building",
      company: "HobbyHub",
      title: "CEO & Founder",
      lookingFor: "cofounder",
      skills: JSON.stringify(["React", "Node.js", "Python", "Product"]),
      collegeName: "IIT Bangalore",
      graduationYear: 2024,
    },
  });

  // ─── 50 NEARBY USERS ───
  console.log("Creating 50 users...");
  const users = [];
  for (let i = 0; i < 50; i++) {
    const loc = nearby(0.03);
    const user = await prisma.user.create({
      data: {
        name: NAMES[i % NAMES.length],
        email: `${NAMES[i % NAMES.length].toLowerCase()}${i}@hobbyhub.app`,
        bio: BIOS[i % BIOS.length],
        interests: JSON.stringify(pickN(INTEREST_POOL, 3 + Math.floor(Math.random() * 4))),
        lat: loc.lat,
        lng: loc.lng,
        online: Math.random() > 0.25,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        role: pick(ROLES),
        startupStage: pick(STAGES),
        company: pick(COMPANIES),
        title: pick(TITLES),
        lookingFor: pick(LOOKING_FOR),
        skills: JSON.stringify(pickN(SKILL_POOL, Math.floor(Math.random() * 5))),
        collegeName: pick(COLLEGES),
        graduationYear: Math.random() > 0.5 ? 2020 + Math.floor(Math.random() * 6) : 0,
      },
    });
    users.push(user);
  }

  // ─── 30 ACTIVITIES (mixed types: sports, fitness, hangout, events, networking, workshops) ───
  console.log("Creating 30 activities...");
  const activityTemplates = [
    // Sports
    { type: "sports", title: "Badminton Doubles at Cubbon Park", desc: "Looking for doubles partners! All levels welcome.", needed: 4, cat: "fitness" },
    { type: "sports", title: "Cricket - Need 3 More Players", desc: "T20 style, 8-a-side at the ground.", needed: 8, cat: "fitness" },
    { type: "sports", title: "Football 5v5 - HSR Layout", desc: "Intense 5v5. Bring boots and water!", needed: 10, cat: "fitness" },
    { type: "sports", title: "Basketball Pickup Game", desc: "3v3 half court, all skill levels.", needed: 6, cat: "fitness" },
    { type: "sports", title: "Tennis Singles Anyone?", desc: "Looking for a rally partner this evening.", needed: 2, cat: "fitness" },
    // Fitness
    { type: "fitness", title: "Morning 5K Jog - Ulsoor Lake", desc: "Daily morning jog group. All paces welcome.", needed: 15, cat: "fitness" },
    { type: "fitness", title: "Sunrise Yoga at Lalbagh", desc: "Free outdoor yoga session for all.", needed: 20, cat: "fitness" },
    { type: "fitness", title: "CrossFit Group Session", desc: "HIIT + functional training. Be prepared to sweat!", needed: 8, cat: "fitness" },
    { type: "fitness", title: "Cycling to Nandi Hills", desc: "50km round trip. Intermediate level.", needed: 10, cat: "fitness" },
    // Hangout / Social
    { type: "hangout", title: "Coffee at Third Wave ☕", desc: "Chill hangout, talking startups & life.", needed: 5, cat: "social" },
    { type: "hangout", title: "Board Games Night", desc: "Catan, Codenames, and more! BYO snacks.", needed: 8, cat: "social" },
    { type: "hangout", title: "Brunch at Indiranagar", desc: "Weekend brunch crew. Foodies only!", needed: 6, cat: "social" },
    { type: "food", title: "Street Food Trail - VV Puram", desc: "Exploring the famous food street together!", needed: 8, cat: "social" },
    { type: "food", title: "Dosa Challenge - 10 Varieties", desc: "Who can try all 10? Let's go!", needed: 4, cat: "social" },
    // Creative
    { type: "photography", title: "Golden Hour Photowalk 📸", desc: "Bring camera/phone. Capturing sunset magic!", needed: 10, cat: "social" },
    { type: "music", title: "Open Mic Night Jam", desc: "Guitars, keyboards, vocals welcome.", needed: 6, cat: "social" },
    { type: "art", title: "Sketching at Lalbagh Gardens", desc: "Plein air sketching session. All mediums.", needed: 8, cat: "social" },
    { type: "music", title: "Drumming Circle in the Park", desc: "Bring any percussion instrument!", needed: 12, cat: "social" },
    // Learning
    { type: "study", title: "DSA Grind Session 💻", desc: "Solving Leetcode hard problems together.", needed: 6, cat: "learning" },
    { type: "workshop", title: "React Workshop for Beginners", desc: "Build your first React app in 2 hours.", needed: 20, cat: "learning" },
    { type: "study", title: "Book Club - Atomic Habits", desc: "Discussing chapters 5-8 this week.", needed: 8, cat: "learning" },
    { type: "workshop", title: "Figma Design Sprint", desc: "Design a mobile app in 3 hours. No experience needed.", needed: 15, cat: "learning" },
    // Events
    { type: "event", title: "Startup Pitch Night 🚀", desc: "5 startups pitch to angel investors. Free entry!", needed: 50, cat: "event", isEvent: true, price: 0 },
    { type: "event", title: "Tech Meetup - AI & Future", desc: "Panel discussion + networking. Pizza included.", needed: 40, cat: "event", isEvent: true, price: 0 },
    { type: "event", title: "Indie Music Festival", desc: "Local bands, food stalls, good vibes!", needed: 100, cat: "event", isEvent: true, price: 200 },
    { type: "event", title: "Hackathon - Build in 24hrs", desc: "Teams of 4. Cash prizes!", needed: 60, cat: "event", isEvent: true, price: 0 },
    // Professional / Networking
    { type: "networking", title: "Founder Breakfast HSR", desc: "Monthly founder meetup. Share struggles & wins.", needed: 20, cat: "professional" },
    { type: "networking", title: "Designer Drinks 🎨", desc: "UI/UX designers networking over craft beer.", needed: 15, cat: "professional" },
    // Travel
    { type: "travel", title: "Weekend Trek to Savandurga", desc: "Moderate difficulty, 4-hour hike. Carpooling!", needed: 10, cat: "social" },
    { type: "travel", title: "Road Trip to Mysore Palace", desc: "Day trip! Leaving 6AM sharp.", needed: 4, cat: "social" },
  ];

  const chatPhrases = [
    "Count me in! 🙌", "What time exactly?", "Is this beginner friendly?",
    "On my way! 🏃", "Can I bring a friend along?", "This sounds amazing!",
    "See you there! ⚡", "I'll be 10 mins late", "Thanks for organizing!",
    "Anyone carpooling from Koramangala?", "What should I bring?",
    "Let's gooo! 🔥", "Saved the date!", "How do I reach there?",
    "Perfect timing, I'm free!", "Who else is coming?",
  ];

  for (let i = 0; i < activityTemplates.length; i++) {
    const t = activityTemplates[i];
    const creator = users[i % users.length];
    const loc = nearby(0.02);
    const time = futureDate(1, 72);

    const activity = await prisma.activity.create({
      data: {
        type: t.type, title: t.title, description: t.desc,
        lat: loc.lat, lng: loc.lng, time,
        playersNeeded: t.needed, creatorId: creator.id,
        category: t.cat,
        isEvent: !!(t as unknown as Record<string, unknown>).isEvent,
        ticketPrice: ((t as unknown as Record<string, unknown>).price as number) || 0,
        isFree: !((t as unknown as Record<string, unknown>).price),
      },
    });

    // Creator joins
    await prisma.participant.create({ data: { userId: creator.id, activityId: activity.id } });

    // Add random participants
    const pCount = 1 + Math.floor(Math.random() * Math.min(t.needed - 1, 8));
    const shuffled = pickN(users, pCount + 2);
    for (const p of shuffled) {
      if (p.id === creator.id) continue;
      await prisma.participant.create({ data: { userId: p.id, activityId: activity.id } }).catch(() => {});
    }

    // Add chat messages
    const msgCount = 2 + Math.floor(Math.random() * 6);
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
  console.log("Creating 10 skill sessions...");
  const skillTemplates = [
    { skill: "Learn React from Scratch", desc: "Beginner-friendly. Build a todo app!", type: "teaching", free: true, price: 0, schedule: "Sat 10AM" },
    { skill: "Python for Machine Learning", desc: "Hands-on ML with scikit-learn.", type: "teaching", free: false, price: 500, schedule: "Sun 2PM" },
    { skill: "UI/UX Design Masterclass", desc: "Figma + design thinking workshop.", type: "teaching", free: false, price: 300, schedule: "Sat 3PM" },
    { skill: "Guitar for Beginners 🎸", desc: "Acoustic guitar fundamentals.", type: "teaching", free: true, price: 0, schedule: "Evenings" },
    { skill: "Public Speaking & Confidence", desc: "Overcome stage fear in 4 sessions.", type: "teaching", free: true, price: 0, schedule: "Wed 6PM" },
    { skill: "Flutter Mobile Development", desc: "Build cross-platform apps.", type: "teaching", free: false, price: 400, schedule: "Sun 11AM" },
    { skill: "Photography Basics 📷", desc: "Composition, lighting, editing.", type: "teaching", free: true, price: 0, schedule: "Sat 5PM" },
    { skill: "Cooking - South Indian 🍳", desc: "Master dosa, idli, sambar!", type: "teaching", free: true, price: 0, schedule: "Sun 9AM" },
    { skill: "Want to Learn Kotlin", desc: "Looking for Android dev mentor.", type: "learning", free: false, price: 300, schedule: "Flexible" },
    { skill: "Yoga & Meditation 🧘", desc: "Daily morning practice guide.", type: "teaching", free: true, price: 0, schedule: "Daily 6AM" },
  ];

  for (let i = 0; i < skillTemplates.length; i++) {
    const s = skillTemplates[i];
    const loc = nearby(0.02);
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
  console.log("Creating 10 gigs...");
  const gigTemplates = [
    { title: "📸 Product Photographer Needed", desc: "E-commerce product shoot, 50 items.", budget: 5000, skills: ["Photography"] },
    { title: "React Developer - Fix Auth Bug", desc: "NextAuth.js session issue, should be quick.", budget: 3000, skills: ["React", "Node.js"] },
    { title: "Logo Design for New Cafe", desc: "Modern minimalist logo. Multiple revisions.", budget: 4000, skills: ["Design"] },
    { title: "Video Editor for YouTube Channel", desc: "Edit 3 vlogs per week. Long-term.", budget: 8000, skills: ["Video"] },
    { title: "Content Writer - Tech Blog", desc: "5 articles/month, 1500 words each.", budget: 6000, skills: ["Content", "SEO"] },
    { title: "Flutter App - MVP Development", desc: "Food delivery app MVP in 2 weeks.", budget: 25000, skills: ["Flutter", "Kotlin"] },
    { title: "Social Media Manager", desc: "Handle Instagram + Twitter for startup.", budget: 10000, skills: ["Marketing", "Content"] },
    { title: "Data Analyst - Dashboard", desc: "Build analytics dashboard in Streamlit.", budget: 7000, skills: ["Python", "Data Science"] },
    { title: "Music for Short Film", desc: "Background score, 15-min film.", budget: 3500, skills: ["Video"] },
    { title: "Figma to Code - Landing Page", desc: "Convert Figma design to Next.js.", budget: 5000, skills: ["React", "Design"] },
  ];

  for (let i = 0; i < gigTemplates.length; i++) {
    const g = gigTemplates[i];
    const loc = nearby(0.02);
    const gig = await prisma.gig.create({
      data: {
        title: g.title, description: g.desc, budget: g.budget,
        skills: JSON.stringify(g.skills),
        deadline: new Date(Date.now() + (3 + i * 2) * 86400000).toISOString().split("T")[0],
        lat: loc.lat, lng: loc.lng,
        creatorId: users[i % users.length].id,
      },
    });

    // Add 1-3 applications
    const appCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < appCount; j++) {
      await prisma.gigApplication.create({
        data: {
          gigId: gig.id,
          userId: users[(i + j + 5) % users.length].id,
          message: pick(["I'm interested! Check my portfolio.", "Available immediately.", "I can do this, let's discuss."]),
        },
      }).catch(() => {});
    }
  }

  // ─── 8 TRIPS ───
  console.log("Creating 8 trips...");
  const tripTemplates = [
    { dest: "Goa 🏖️", desc: "Beach vibes, parties, seafood. 3 days!", type: "beach", budget: "8000-12000", max: 6 },
    { dest: "Nandi Hills Sunrise", desc: "Leave at 3AM, watch the sunrise!", type: "trekking", budget: "500-1000", max: 10 },
    { dest: "Coorg Coffee Trail ☕", desc: "Coffee plantations, waterfalls, homestay.", type: "weekend", budget: "5000-8000", max: 4 },
    { dest: "Hampi Heritage Trip", desc: "2 days exploring ruins & bouldering.", type: "cultural", budget: "4000-6000", max: 6 },
    { dest: "Pondicherry Road Trip 🚗", desc: "French Quarter, beaches, food!", type: "road_trip", budget: "6000-10000", max: 4 },
    { dest: "Wayanad Trek & Camp", desc: "Camping under stars. Moderate trek.", type: "adventure", budget: "3000-5000", max: 8 },
    { dest: "Ooty Weekend Getaway", desc: "Hills, tea gardens, toy train!", type: "weekend", budget: "4000-7000", max: 5 },
    { dest: "Ladakh Bike Trip 🏔️", desc: "10-day epic bike trip. Planning phase.", type: "adventure", budget: "25000-35000", max: 6 },
  ];

  for (let i = 0; i < tripTemplates.length; i++) {
    const t = tripTemplates[i];
    const loc = nearby(0.02);
    const trip = await prisma.trip.create({
      data: {
        destination: t.dest, description: t.desc, tripType: t.type,
        budget: t.budget, maxBuddies: t.max,
        startDate: new Date(Date.now() + (2 + i * 3) * 86400000).toISOString().split("T")[0],
        endDate: new Date(Date.now() + (4 + i * 3) * 86400000).toISOString().split("T")[0],
        lat: loc.lat, lng: loc.lng,
        creatorId: users[i % users.length].id,
      },
    });

    // Add some participants
    const pCount = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < pCount; j++) {
      await prisma.tripParticipant.create({
        data: { tripId: trip.id, userId: users[(i + j + 10) % users.length].id },
      }).catch(() => {});
    }
  }

  // ─── 8 IDEAS ───
  console.log("Creating 8 ideas...");
  const ideaTemplates = [
    { title: "AI Recipe Generator 🤖", desc: "Scan your fridge, get personalized recipes with nutritional info.", cat: "tech", stage: "concept", looking: "Developer, Designer" },
    { title: "Local Delivery Co-op", desc: "Community-owned hyperlocal delivery. No middleman fees.", cat: "social", stage: "validating", looking: "Co-founder, Operations" },
    { title: "Campus Event Discovery", desc: "Tinder-style swipe for campus events. Never miss cool stuff.", cat: "education", stage: "building", looking: "Flutter Dev" },
    { title: "Sustainable Fashion Swap", desc: "Swap clothes locally instead of buying new. Save the planet!", cat: "business", stage: "concept", looking: "Marketing, Design" },
    { title: "Freelancer Co-working Finder", desc: "Find real-time open seats at cafes & co-working spaces.", cat: "tech", stage: "validating", looking: "React Dev" },
    { title: "Neighbourhood Safety App", desc: "Report issues, track local crime, alert neighbours.", cat: "social", stage: "concept", looking: "Backend Dev, Data Science" },
    { title: "Pet Playdate Matcher 🐕", desc: "Match dog owners for playdates based on breed & location.", cat: "creative", stage: "building", looking: "Flutter Dev, Designer" },
    { title: "Micro-Mentorship Platform", desc: "15-min mentorship calls with industry experts. Pay per session.", cat: "business", stage: "launched", looking: "Marketing, Sales" },
  ];

  for (let i = 0; i < ideaTemplates.length; i++) {
    const idea = ideaTemplates[i];
    const loc = nearby(0.02);
    const created = await prisma.idea.create({
      data: {
        title: idea.title, description: idea.desc,
        category: idea.cat, stage: idea.stage, lookingFor: idea.looking,
        likes: 5 + Math.floor(Math.random() * 40),
        lat: loc.lat, lng: loc.lng,
        creatorId: users[i % users.length].id,
      },
    });

    // Add 2-4 comments each
    const commentTexts = [
      "Love this idea! 🔥", "Would definitely use this.", "Have you validated the market?",
      "I can help with the tech side!", "What's the revenue model?", "This already exists?",
      "Let's chat about this over coffee!", "Shared with my network.",
    ];
    const cCount = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < cCount; j++) {
      await prisma.ideaComment.create({
        data: {
          text: pick(commentTexts),
          ideaId: created.id,
          userId: users[(i + j + 3) % users.length].id,
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 3),
        },
      });
    }
  }

  // ─── 15 CONNECTIONS ───
  console.log("Creating connections...");
  for (let i = 0; i < 15; i++) {
    await prisma.connection.create({
      data: {
        fromUserId: demoUser.id,
        toUserId: users[i].id,
        interactionCount: 1 + Math.floor(Math.random() * 15),
      },
    }).catch(() => {});
  }

  // Cross-connections between users
  for (let i = 0; i < 30; i++) {
    await prisma.connection.create({
      data: {
        fromUserId: users[i % users.length].id,
        toUserId: users[(i + 5) % users.length].id,
        interactionCount: 1 + Math.floor(Math.random() * 8),
      },
    }).catch(() => {});
  }

  // ─── 5 BUSINESSES ───
  console.log("Creating businesses...");
  const businesses = [
    { name: "Third Wave Coffee ☕", desc: "Specialty coffee roasters & cafe", cat: "cafe", addr: "HSR Layout, 27th Main", rating: 4.6 },
    { name: "The Playce Sports", desc: "Multi-sport facility with courts", cat: "sports", addr: "Koramangala, 5th Block", rating: 4.3 },
    { name: "Cowork Central", desc: "Co-working space with fast wifi", cat: "coworking", addr: "Indiranagar, 12th Main", rating: 4.5 },
    { name: "Canvas & Co Art Studio", desc: "Art supplies & workshop space", cat: "studio", addr: "Jayanagar, 4th Block", rating: 4.7 },
    { name: "FitZone Gym 💪", desc: "24/7 gym with CrossFit area", cat: "gym", addr: "BTM Layout, 2nd Stage", rating: 4.2 },
  ];

  for (let i = 0; i < businesses.length; i++) {
    const b = businesses[i];
    const loc = nearby(0.015);
    await prisma.business.create({
      data: {
        name: b.name, description: b.desc, category: b.cat,
        address: b.addr, rating: b.rating,
        lat: loc.lat, lng: loc.lng,
        phone: `080-${String(Math.floor(Math.random() * 90000000 + 10000000))}`,
        website: `${b.name.toLowerCase().replace(/[^a-z]/g, "")}.in`,
        hours: "8AM - 10PM",
        ownerId: users[i].id,
      },
    });
  }

  // ─── DMs ───
  console.log("Creating DM conversations...");
  const dmPairs = [[0, 1], [0, 5], [2, 7], [3, 12]];
  for (const [a, b] of dmPairs) {
    const msgs = ["Hey! Saw you nearby 👋", "Hi! What are you working on?", "Let's connect!", "Sure, coffee sometime?"];
    for (let m = 0; m < msgs.length; m++) {
      await prisma.directMessage.create({
        data: {
          text: msgs[m],
          senderId: m % 2 === 0 ? users[a].id : users[b].id,
          receiverId: m % 2 === 0 ? users[b].id : users[a].id,
          createdAt: new Date(Date.now() - (msgs.length - m) * 300000),
        },
      });
    }
  }

  // ─── NOTIFICATIONS ───
  console.log("Creating notifications...");
  const notifs = [
    { type: "activity_joined", title: "New Participant!", body: "Aarav joined your Badminton Doubles" },
    { type: "new_activity", title: "New Activity Nearby", body: "Football 5v5 just posted - 300m away" },
    { type: "chat_message", title: "New Message", body: "Priya sent a message in Cricket group" },
    { type: "rating", title: "⭐ New Rating", body: "You received a 5-star rating from Rohan!" },
    { type: "hotspot", title: "🔥 Hotspot Alert", body: "8 people playing sports near Cubbon Park!" },
    { type: "gig_application", title: "Gig Application", body: "Dev applied to your Photography gig" },
    { type: "trip_joined", title: "Travel Buddy! ✈️", body: "Meera joined your Goa trip" },
    { type: "idea_comment", title: "💬 New Comment", body: "Kabir commented on AI Recipe Generator" },
    { type: "profile_request", title: "Connection Request", body: "Sneha wants to connect with you" },
    { type: "system", title: "Welcome to HobbyHub!", body: "Start exploring activities & people nearby" },
  ];
  for (const n of notifs) {
    await prisma.notification.create({ data: { ...n, userId: demoUser.id } });
  }

  console.log("\n✅ Seed complete!");
  console.log(`📊 Created: ${users.length} users, ${activityTemplates.length} activities, 10 skills, 10 gigs, 8 trips, 8 ideas, 45 connections, 5 businesses`);
  console.log(`🆔 Demo user: ${demoUser.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
