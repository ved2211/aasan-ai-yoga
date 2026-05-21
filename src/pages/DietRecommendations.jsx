import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { subscribeToUserSessions } from '../utils/userData';
import { toast } from 'react-hot-toast';

// ─── COMPREHENSIVE DIET PLANS (4-Meal Structure + Macros + Grocery Lists) ─────
const dietPlans = {
  Balanced: {
    none: {
      pre: { title: "Pre-Yoga Energy", desc: "1 Banana + Handful of Raw Almonds", why: "Quick simple carbs and magnesium to awaken body awareness." },
      post: { title: "Post-Yoga Nourishment", desc: "Yellow Dal + Steamed Rice + Fresh Salad", why: "Balanced carbs and complete plant protein for steady energy release." },
      mid: { title: "Mid-Day Hydration Boost", desc: "1 Glass Fresh Coconut Water + 1 tsp Chia Seeds", why: "Natural source of electrolytes and gut-healthy fiber." },
      dinner: { title: "Restful Night Dinner", desc: "Moong Dal Khichdi + Steamed Cauliflower & Peas + 1 tsp A2 Ghee", why: "Warm, grounding, and exceptionally easy to digest to promote deep sleep." },
      macros: { carbs: 55, protein: 20, fats: 25 },
      calories: 1400,
      water: 6,
      grocery: ["Bananas", "Raw Almonds", "Yellow Lentils (Dal)", "Basmati Rice", "Mixed Greens", "Fresh Coconuts", "Chia Seeds", "Split Moong Dal", "Cauliflower", "Green Peas", "A2 Ghee"]
    },
    low: {
      pre: { title: "Pre-Yoga Energy", desc: "1 Banana + Handful of Raw Almonds", why: "Simple carbs and minerals to fuel muscle movements." },
      post: { title: "Post-Yoga Recovery", desc: "2 Whole Wheat Rotis + Mixed Paneer Sabzi + 1 Cup Fresh Curd", why: "Protein, complex carbs, and probiotics for muscle repair and healthy gut." },
      mid: { title: "Mid-Day Hydration Boost", desc: "Probiotic Greek Yogurt + Fresh Mixed Berries", why: "Rich in antioxidants and calcium to maintain bone strength." },
      dinner: { title: "Restful Night Dinner", desc: "Warm Lentil Soup + Whole Wheat Spinach Wrap", why: "Light protein and micronutrients that soothe the nervous system." },
      macros: { carbs: 50, protein: 22, fats: 28 },
      calories: 1650,
      water: 7,
      grocery: ["Bananas", "Raw Almonds", "Whole Wheat Flour", "Mixed Veggies", "Paneer", "Fresh Curd", "Greek Yogurt", "Mixed Berries", "Lentils", "Fresh Spinach"]
    },
    moderate: {
      pre: { title: "Pre-Yoga Fuel", desc: "Warm Rolled Oats cooked in Almond Milk with Honey + 2 Medjool Dates", why: "Sustained-release complex carbs for a fluid, moderate-intensity flow." },
      post: { title: "Post-Yoga Recovery", desc: "Grilled Chicken Breast (or Pan-Seared Paneer) + Brown Rice + Avocado Salad", why: "High protein and clean fats to restore depleted energy after a strong practice." },
      mid: { title: "Mid-Day Rejuvenation", desc: "Dry Roasted Makhana (Foxnuts) + Warm Mug of Tulsi Green Tea", why: "Healthy low-calorie crunchy fats rich in antioxidants to keep concentration high." },
      dinner: { title: "Restful Night Dinner", desc: "Creamy Pumpkin Soup + Sweet Potato Mash + Sautéed Asparagus", why: "Beta-carotene rich carbs that aid muscle recovery and relaxation." },
      macros: { carbs: 48, protein: 27, fats: 25 },
      calories: 1950,
      water: 8,
      grocery: ["Rolled Oats", "Almond Milk", "Organic Honey", "Medjool Dates", "Chicken Breast / Paneer", "Brown Rice", "Avocados", "Foxnuts (Makhana)", "Tulsi Green Tea", "Pumpkin", "Sweet Potatoes", "Asparagus"]
    },
    high: {
      pre: { title: "Pre-Yoga Power Meal", desc: "2 Soft Boiled Eggs (or Tofu Scramble) + Sourdough Toast + Freshly Squeezed OJ", why: "Fast-acting carbs, protein, and vitamin C for peak muscle oxygenation." },
      post: { title: "Post-Yoga Protein Boost", desc: "Paneer Tikka Skewers (or Grilled Salmon) + Quinoa Bowl + Fresh Coconut Water", why: "Maximum bio-available protein and amino acids to support heavy muscle recovery." },
      mid: { title: "Mid-Day Rejuvenation", desc: "Plant Protein Shake with 1 tbsp Hemp Seeds + 1 Banana", why: "Speeds up muscle tissue repair and provides essential Omega-3 fatty acids." },
      dinner: { title: "Restful Night Dinner", desc: "Hearty Chickpea & Spinach Curry + Steamed Quinoa", why: "Iron, protein, and complex carbs to replenish glycogen reserves fully." },
      macros: { carbs: 45, protein: 32, fats: 23 },
      calories: 2250,
      water: 10,
      grocery: ["Eggs / Tofu", "Sourdough Bread", "Oranges", "Paneer / Salmon", "Quinoa", "Fresh Coconuts", "Protein Powder", "Hemp Seeds", "Bananas", "Chickpeas", "Spinach", "Curry Spices"]
    }
  },
  Vegan: {
    none: {
      pre: { title: "Pre-Yoga Energy", desc: "Apple Slices + 1 tbsp Organic Peanut Butter", why: "Clean plant-based energy with healthy slow-burning fats." },
      post: { title: "Post-Yoga Nourishment", desc: "Split Moong Dal + Brown Basmati Rice + Sautéed Cucumber Salad", why: "Light complete protein and digestive-friendly fibers." },
      mid: { title: "Mid-Day Hydration Boost", desc: "1 Glass Fresh Coconut Water + 1 tsp Chia Seeds", why: "Natural source of potassium, magnesium, and hydration." },
      dinner: { title: "Restful Night Dinner", desc: "Zucchini & Carrot Kitchari + 1 tsp Cold-Pressed Sesame Oil", why: "Warm, cleansing, and comforting soup-like rice to calm the mind." },
      macros: { carbs: 58, protein: 18, fats: 24 },
      calories: 1350,
      water: 6,
      grocery: ["Apples", "Peanut Butter", "Split Moong Dal", "Brown Basmati Rice", "Cucumbers", "Fresh Coconuts", "Chia Seeds", "Zucchini", "Carrots", "Cold-Pressed Sesame Oil"]
    },
    low: {
      pre: { title: "Pre-Yoga Energy", desc: "Apple Slices + 1 tbsp Organic Peanut Butter", why: "Clean plant-based energy with healthy fats." },
      post: { title: "Post-Yoga Recovery", desc: "Creamy Red Lentil Soup + Whole Grain Rye Toast", why: "Rich in plant-based iron and easily absorbable protein." },
      mid: { title: "Mid-Day Hydration Boost", desc: "Organic Soy Yogurt + Flaked Almonds + Fresh Blueberries", why: "Probiotics for gut health combined with vitamin C and zinc." },
      dinner: { title: "Restful Night Dinner", desc: "Baked Falafel + Hummus + Steamed Broccoli", why: "Mineral-rich, filling yet highly alkaline meal to relax muscles." },
      macros: { carbs: 54, protein: 20, fats: 26 },
      calories: 1600,
      water: 7,
      grocery: ["Apples", "Peanut Butter", "Red Lentils", "Whole Grain Rye Bread", "Soy Yogurt", "Almond Flakes", "Blueberries", "Chickpeas (for Falafel)", "Hummus", "Broccoli"]
    },
    moderate: {
      pre: { title: "Pre-Yoga Fuel", desc: "Smoothie: 1 Banana + 1 Cup Oat Milk + 1 tbsp Chia Seeds + 1 Scoop Hemp Powder", why: "Dense, easily digestible liquid fuel perfect for moderate yogic flows." },
      post: { title: "Post-Yoga Recovery", desc: "Pan-Seared Organic Tofu + Steamed Quinoa + Kale & Avocado Salad", why: "Complete plant protein block and anti-inflammatory healthy fats." },
      mid: { title: "Mid-Day Rejuvenation", desc: "Dry Roasted Foxnuts (Makhana) + Handful of Raw Walnuts + Matcha Tea", why: "Enhances mental clarity, cognitive stamina, and cellular repair." },
      dinner: { title: "Restful Night Dinner", desc: "Roasted Butternut Squash + Stewed Black Beans + Sautéed Swiss Chard", why: "Excellent source of potassium and magnesium to soothe achy muscles." },
      macros: { carbs: 50, protein: 22, fats: 28 },
      calories: 1850,
      water: 8,
      grocery: ["Bananas", "Oat Milk", "Chia Seeds", "Hemp Protein Powder", "Organic Tofu", "Quinoa", "Kale", "Avocados", "Foxnuts (Makhana)", "Raw Walnuts", "Matcha Powder", "Butternut Squash", "Black Beans", "Swiss Chard"]
    },
    high: {
      pre: { title: "Pre-Yoga Power Smoothie", desc: "Pea Protein Shake + 2 Medjool Dates + Almond Butter + Cup of Spinach", why: "Alkalizing, nitrate-rich, and protein-packed fuel to supercharge core work." },
      post: { title: "Post-Yoga Recovery Bowl", desc: "Chickpea & Sweet Potato Buddha Bowl + Tahini Dressing + Coconut Water", why: "Replenishes glycogen, provides vital zinc, and delivers soothing hydration." },
      mid: { title: "Mid-Day Rejuvenation", desc: "Organic Soy Milk Chia Pudding + Fresh Raspberries & Pumpkin Seeds", why: "Omega-3 rich recovery snack providing continuous amino acid release." },
      dinner: { title: "Restful Night Dinner", desc: "Spiced Green Mung Beans Curry + Wild Rice Bowl + Roasted Cauliflower", why: "Powerful detoxifying protein and trace minerals to replenish body tissues." },
      macros: { carbs: 48, protein: 26, fats: 26 },
      calories: 2100,
      water: 10,
      grocery: ["Pea Protein Powder", "Medjool Dates", "Almond Butter", "Spinach", "Chickpeas", "Sweet Potatoes", "Tahini", "Fresh Coconuts", "Soy Milk", "Chia Seeds", "Raspberries", "Pumpkin Seeds", "Whole Mung Beans", "Wild Rice", "Cauliflower"]
    }
  },
  Keto: {
    none: {
      pre: { title: "Pre-Yoga Snack", desc: "Half Avocado sprinkled with Pink Himalayan Salt & Olive Oil", why: "Pure fat-based energy and vital minerals for muscle firing." },
      post: { title: "Post-Yoga Meal", desc: "3 Scrambled Eggs cooked in Butter + Wilted Spinach & Feta Cheese", why: "Excellent amino acids and low-glycemic fats for cellular repair." },
      mid: { title: "Mid-Day Hydration Boost", desc: "1 Glass Electrolyte Water + Lemon + 1 tbsp MCT Oil", why: "Instant ketone fuel and cellular hydration without the glucose." },
      dinner: { title: "Restful Night Dinner", desc: "Pan-Seared Salmon + Steamed Asparagus with Garlic Butter", why: "Rich in calming Omega-3s, magnesium, and healthy saturated fats." },
      macros: { carbs: 5, protein: 25, fats: 70 },
      calories: 1450,
      water: 7,
      grocery: ["Avocados", "Pink Himalayan Salt", "Olive Oil", "Eggs", "Butter", "Fresh Spinach", "Feta Cheese", "Lemon", "MCT Oil", "Fresh Salmon", "Asparagus", "Garlic"]
    },
    low: {
      pre: { title: "Pre-Yoga Snack", desc: "Half Avocado sprinkled with Pink Himalayan Salt & Olive Oil", why: "Pure fat-based energy and vital minerals for muscle firing." },
      post: { title: "Post-Yoga Recovery", desc: "Grilled Chicken Thighs + Sautéed Green Beans + Crumbled Goat Cheese", why: "Medium chain proteins and fats to support tissue micro-tears." },
      mid: { title: "Mid-Day Hydration Boost", desc: "Full Fat Cottage Cheese (Paneer) + Handful of Raw Pecans", why: "High protein, calcium-rich snack providing sustained ketosis support." },
      dinner: { title: "Restful Night Dinner", desc: "Baked Sea Bass + Sautéed Zucchini Noodles in Basil Pesto", why: "Excellent clean protein and healthy fats that support brain repair." },
      macros: { carbs: 5, protein: 27, fats: 68 },
      calories: 1750,
      water: 8,
      grocery: ["Avocados", "Pink Himalayan Salt", "Chicken Thighs", "Green Beans", "Goat Cheese", "Paneer / Cottage Cheese", "Raw Pecans", "Sea Bass", "Zucchini", "Basil Pesto"]
    },
    moderate: {
      pre: { title: "Pre-Yoga Fuel", desc: "MCT Oil Coffee (Bulletproof) + 2 Hard Boiled Eggs", why: "Clean fat energy to fuel continuous cardiovascular endurance." },
      post: { title: "Post-Yoga Recovery", desc: "Grilled Ribeye Steak + Garlic Herb Butter + Roasted Cauliflower Mash", why: "High protein, iron, and sodium-rich fats to replenish vital trace minerals." },
      mid: { title: "Mid-Day Rejuvenation", desc: "Celery Stalks + 2 tbsp Cream Cheese + Slices of Cucumber", why: "Highly hydrating low-carb snack that replenishes natural sodium." },
      dinner: { title: "Restful Night Dinner", desc: "Baked Chicken Breast stuffed with Spinach & Cream + Buttered Broccoli", why: "Satiating high-protein keto meal to trigger continuous growth hormone release." },
      macros: { carbs: 6, protein: 30, fats: 64 },
      calories: 2050,
      water: 9,
      grocery: ["MCT Oil", "Coffee Beans", "Eggs", "Ribeye Steak", "Butter", "Cauliflower", "Celery", "Cream Cheese", "Cucumbers", "Chicken Breast", "Spinach", "Broccoli"]
    },
    high: {
      pre: { title: "Pre-Yoga Keto Power", desc: "Keto Shake: Whey Isolate + Unsweetened Almond Milk + 2 tbsp MCT Oil", why: "Instantly digestible, high-octane fat and amino fuels." },
      post: { title: "Post-Yoga Full Recovery", desc: "Grilled Salmon + 1 Avocado + Herb Butter + Sautéed Mushrooms & Kale", why: "Maximizes Omega-3 fatty acids, potassium, and magnesium for joint support." },
      mid: { title: "Mid-Day Rejuvenation", desc: "Bulletproof Matcha Tea + Handful of Raw Macadamia Nuts", why: "Matches clean fats with powerful thermogenic catechins to boost focus." },
      dinner: { title: "Restful Night Dinner", desc: "Slow Cooked Lamb Stew with Turnips & Celery + Avocado Oil Drizzle", why: "Rich bone-broth collagen and amino acids to support intense joints recovery." },
      macros: { carbs: 7, protein: 33, fats: 60 },
      calories: 2350,
      water: 11,
      grocery: ["Whey Protein Isolate", "Almond Milk", "MCT Oil", "Fresh Salmon", "Avocados", "Butter", "Mushrooms", "Kale", "Matcha Powder", "Macadamia Nuts", "Lamb Stew Meat", "Turnips", "Celery", "Avocado Oil"]
    }
  }
};

// ─── Superfood Spotlight database based on exertion ───────────────────────────
const superfoods = {
  none: [
    { name: "Ginger (Adrak)", benefit: "Soothing & Digestive", desc: "Calms the stomach, aids absorption of food nutrients, and relieves systemic bloat." },
    { name: "Green Tea / Tulsi", benefit: "Gentle Detoxifier", desc: "Highly rich in catechins and polyphenols to clean the body from oxidative stress." },
    { name: "Mint (Pudina)", benefit: "Refreshing Coolant", desc: "Calms the nervous system and provides a cool, refreshed gastrointestinal tract." }
  ],
  low: [
    { name: "Turmeric (Haldi)", benefit: "Antioxidant & Joint Shield", desc: "Active curcumin reduces inflammation, lubricating knees and wrists after simple poses." },
    { name: "Chia Seeds", benefit: "Hydration Anchor", desc: "Absorbs up to 12x their weight in water, helping retain cellular hydration over time." },
    { name: "Raw Honey", benefit: "Pranic Energy Boost", desc: "Enzymatic glucose that replenishes active liver glycogen without overloading insulin levels." }
  ],
  moderate: [
    { name: "Ashwagandha", benefit: "Adrenal & Cortisol Regulator", desc: "Adaptogen that lowers stress hormones and helps muscles recover post-workout." },
    { name: "Coconut Water", benefit: "Isotonic Balance", desc: "Nature's perfect electrolyte drink, loaded with potassium to stop active muscle cramping." },
    { name: "Almonds (Badam)", benefit: "Vitamin E & Bone Health", desc: "Packed with phosphorus and structural magnesium to rebuild micro-damaged bone tissue." }
  ],
  high: [
    { name: "Hemp Seeds", benefit: "Complete Plant Protein", desc: "Deliver all 9 essential amino acids alongside vital Omega-3s for fast muscular repair." },
    { name: "MCT Oil", benefit: "Instant Ketone Energy", desc: "Directly processed by the liver to provide immediate clean energy to depleted cells." },
    { name: "Sweet Potato", benefit: "Glycogen Restorer", desc: "Dense, slow-release complex carbs packed with beta-carotene to fully repair heavy muscle strain." }
  ]
};

// ─── AYURVEDIC DOSHA QUIZ QUESTIONS & PROFILES ─────────────────────────────
const doshaQuizQuestions = [
  {
    id: 0,
    q: "How does your body typically react to the climate?",
    options: [
      { text: "I get cold very easily and prefer warm, humid climates", value: "vata" },
      { text: "I overheat extremely quickly and sweat easily; prefer cool, airy spaces", value: "pitta" },
      { text: "I thrive in dry warmth; damp, cold weather makes me feel heavy and stiff", value: "kapha" }
    ]
  },
  {
    id: 1,
    q: "Describe your general digestion and appetite:",
    options: [
      { text: "Highly irregular; variable hunger, gas, or bloating are common", value: "vata" },
      { text: "Intensely strong; I get irritable ('hangry') if my meals are delayed", value: "pitta" },
      { text: "Slow and steady; I can easily skip meals, but feel heavy after eating", value: "kapha" }
    ]
  },
  {
    id: 2,
    q: "What is your emotional and mental tendency when facing stress?",
    options: [
      { text: "I become anxious, worried, restless, with thousands of racing thoughts", value: "vata" },
      { text: "I become impatient, easily irritated, competitive, or quick to anger", value: "pitta" },
      { text: "I stay relatively calm, but tend to avoid confrontation or become complacent", value: "kapha" }
    ]
  }
];

const doshaProfiles = {
  vata: {
    name: "Vata (Air & Space)",
    color: "#38BDF8", // light blue
    focus: "Grounding, Warming & Nourishing",
    desc: "Vata controls movement, nervous system, and joints. When out of balance, it leads to coldness, dry skin, gas, and anxiety.",
    advice: "Favor cooked, warm, oily, grounding, sweet, and sour foods. Avoid dry crackers, raw leafy salads, and iced beverages. Root vegetables, healthy fats, and stewed fruits are perfect.",
    ally: "Ashwagandha & Warm Sesame Oil"
  },
  pitta: {
    name: "Pitta (Fire & Water)",
    color: "#F87171", // soft red
    focus: "Cooling, Hydrating & Soothing",
    desc: "Pitta governs metabolism, heat, and digestion. When aggravated, it manifests as inflammation, acid reflux, anger, or skin rashes.",
    advice: "Favor sweet, cooling, bitter, and astringent tastes. Avoid extremely hot spices, garlic, onions, deep-fried food, and alcohol. Fresh melons, cucumbers, mint, coconut, and ghee are ideal.",
    ally: "Shatavari & Coconut Water"
  },
  kapha: {
    name: "Kapha (Earth & Water)",
    color: "#34D399", // soft green
    focus: "Light, Stimulating & Cleansing",
    desc: "Kapha controls physical structure, lubrication, and stability. Imbalance causes weight gain, lethargy, congestion, and attachment.",
    advice: "Favor warm, light, dry, spicy, and bitter foods. Limit dairy, heavy oils, refined sugars, and cold drinks. Opt for heated lentils, pungent spices (ginger, pepper), sprouts, and roasted grains.",
    ally: "Trikatu (Ginger, Black Pepper, Pippali)"
  }
};

// ─── HOURLY TEA RECIPES ─────────────────────────────────────────────────────
const teaRecipes = {
  Morning: {
    title: "Agni Lemongrass & Ginger Infusion",
    timing: "Best taken: 6:00 AM - 12:00 PM",
    benefit: "Ignites digestive fire & boosts morning focus",
    desc: "Simmer crushed fresh ginger, 1 stalk lemongrass, and 1/2 tsp turmeric in hot water for 3-5 mins. Drizzle raw honey after cooling slightly.",
    emoji: "☀️"
  },
  Afternoon: {
    title: "Cooling CCF (Cumin, Coriander & Fennel)",
    timing: "Best taken: 12:00 PM - 5:00 PM",
    benefit: "Calms stomach acids & reduces bloating",
    desc: "Steep 1/4 tsp whole cumin, 1/4 tsp coriander seeds, and 1/2 tsp sweet fennel seeds in boiling water. Restores gut balance and sharpens focus.",
    emoji: "🌤️"
  },
  Evening: {
    title: "Tulsi Holy Basil & Cardamom Elixir",
    timing: "Best taken: 5:00 PM - 9:00 PM",
    benefit: "Calms high cortisol & centers the spirit",
    desc: "Infuse fresh Tulsi leaves with a crushed cardamom pod. Balances the nervous system after work and prepares the body for deep stretching.",
    emoji: "🌇"
  },
  Night: {
    title: "Soma Ashwagandha & Chamomile Sleep Tonic",
    timing: "Best taken: 9:00 PM onwards",
    benefit: "Promotes delta-wave sleep & repairs deep tissues",
    desc: "Brew dried chamomile flowers with a pinch of organic ashwagandha powder in warm almond milk. Highly grounding for active, achy muscles.",
    emoji: "🌙"
  }
};

// ─── EXERTION CALCULATION LOGIC ─────────────────────────────────────────────
const getExertionLevel = (todaySessions) => {
  if (todaySessions.length === 0) return 'none';
  const totalDuration = todaySessions.reduce((s, x) => s + x.duration, 0);
  const avgAccuracy = todaySessions.reduce((s, x) => s + x.accuracy, 0) / todaySessions.length;
  
  if (totalDuration > 1200 || avgAccuracy > 80) return 'high';
  if (totalDuration > 300) return 'moderate';
  return 'low';
};

// ─── DYNAMIC CALORIE BURN RATE ───────────────────────────────────────────────
const getCalorieData = (todaySessions) => {
  const totalDuration = todaySessions.reduce((s, x) => s + x.duration, 0); 
  const avgAccuracy = todaySessions.length > 0
    ? todaySessions.reduce((s, x) => s + x.accuracy, 0) / todaySessions.length : 0;
  const durationMins = totalDuration / 60;

  const burnRate = avgAccuracy > 80 ? 7.2 : avgAccuracy > 50 ? 5.2 : 3.8; 
  const caloriesBurned = Math.round(durationMins * burnRate);

  return { caloriesBurned, durationMins: durationMins.toFixed(1) };
};

const exertionLabels = {
  none: { label: 'No Sessions Today', color: 'var(--text-muted)', emoji: '😴' },
  low: { label: 'Low Exertion', color: 'var(--primary)', emoji: '🧘' },
  moderate: { label: 'Moderate Exertion', color: 'var(--warning)', emoji: '💪' },
  high: { label: 'High Exertion', color: 'var(--danger)', emoji: '🔥' }
};

const DietRecommendations = () => {
  // Primary States
  const [preference, setPreference] = useState('Balanced');
  const [goal, setGoal] = useState('Vitality'); // Vitality, Recovery, Weight
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [isGroceryOpen, setIsGroceryOpen] = useState(false);
  const [checkedGroceryItems, setCheckedGroceryItems] = useState({});

  // Ayurvedic Dosha Quiz State
  const [quizStep, setQuizStep] = useState(0); // 0: Start, 1: Q1, 2: Q2, 3: Q3, 4: Result
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [dominantDosha, setDominantDosha] = useState(() => {
    return localStorage.getItem('user_dominant_dosha') || null;
  });

  // Herbal Brewer Timer State
  const [activeTeaTime, setActiveTeaTime] = useState('Morning');
  const [brewingTimeLeft, setBrewingTimeLeft] = useState(180); // 3 minutes
  const [isBrewing, setIsBrewing] = useState(false);
  const timerRef = useRef(null);

  // Determine current tea selection based on real time of day automatically on mount
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 12) {
      setActiveTeaTime('Morning');
    } else if (currentHour >= 12 && currentHour < 17) {
      setActiveTeaTime('Afternoon');
    } else if (currentHour >= 17 && currentHour < 21) {
      setActiveTeaTime('Evening');
    } else {
      setActiveTeaTime('Night');
    }
  }, []);

  // Timer Tick Effect
  useEffect(() => {
    if (isBrewing && brewingTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setBrewingTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (brewingTimeLeft === 0 && isBrewing) {
      setIsBrewing(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.success("✨ Your Ayurvedic Herbal Elixir is perfectly steeped! Pour, breathe, and enjoy.", {
        duration: 5000,
        icon: '🫖'
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBrewing, brewingTimeLeft]);

  // Subscribe to user sessions
  useEffect(() => {
    let firestoreUnsub = () => {};
    const authUnsub = auth.onAuthStateChanged((currentUser) => {
      firestoreUnsub();
      if (currentUser) {
        firestoreUnsub = subscribeToUserSessions(setSessions);
      }
    });
    return () => { authUnsub(); firestoreUnsub(); };
  }, []);

  // Filter to today's sessions only
  const todayStr = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.date).toDateString() === todayStr);
  const exertion = getExertionLevel(todaySessions);
  const plan = dietPlans[preference][exertion];
  const exertionInfo = exertionLabels[exertion];
  
  const { caloriesBurned } = getCalorieData(todaySessions);

  // Goal & Macro Adjuster Logic
  // Adjust base plan calories & macro split percentages dynamically
  let baseCalories = plan.calories;
  let baseMacros = { ...plan.macros };

  if (goal === 'Recovery') {
    // Increase baseline calories slightly, shift carbs/fat to protein
    baseCalories = Math.round(plan.calories * 1.08); // +8% calories
    baseMacros.protein = Math.min(baseMacros.protein + 6, 40);
    baseMacros.carbs = Math.max(baseMacros.carbs - 3, 5);
    baseMacros.fats = 100 - baseMacros.protein - baseMacros.carbs;
  } else if (goal === 'Weight') {
    // Reduce baseline calories, keep protein high to retain muscle tissue
    baseCalories = Math.round(plan.calories * 0.85); // -15% calories
    baseMacros.protein = Math.min(baseMacros.protein + 4, 38);
    baseMacros.fats = Math.max(baseMacros.fats - 6, 20);
    baseMacros.carbs = 100 - baseMacros.protein - baseMacros.fats;
  }

  // Calculate dynamic macronutrient grams based on goal-adjusted parameters
  // Carbs/Protein = 4 kcal/g, Fats = 9 kcal/g
  const carbGrams = Math.round((baseCalories * (baseMacros.carbs / 100)) / 4);
  const proteinGrams = Math.round((baseCalories * (baseMacros.protein / 100)) / 4);
  const fatGrams = Math.round((baseCalories * (baseMacros.fats / 100)) / 9);

  // Today's stats
  const todayDuration = todaySessions.reduce((s, x) => s + x.duration, 0);
  const todayAvgAccuracy = todaySessions.length > 0
    ? Math.round(todaySessions.reduce((s, x) => s + x.accuracy, 0) / todaySessions.length) : 0;

  // Toggle grocery checklist
  const toggleGroceryItem = (item) => {
    setCheckedGroceryItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  // Copy grocery list to clipboard
  const copyGroceryList = () => {
    const listString = plan.grocery.map(item => `[ ] ${item}`).join('\n');
    navigator.clipboard.writeText(`My Yoga Diet Shopping List (${preference} - ${exertionInfo.label}):\n\n${listString}`)
      .then(() => toast.success('Grocery list copied to clipboard! 🛒'))
      .catch(() => toast.error('Failed to copy. Please try again.'));
  };

  // Ayurvedic Dosha Quiz Processors
  const handleQuizAnswer = (value) => {
    const nextAnswers = [...quizAnswers, value];
    setQuizAnswers(nextAnswers);
    
    if (quizStep < 3) {
      setQuizStep(prev => prev + 1);
    } else {
      // Calculate dominant dosha
      const counts = { vata: 0, pitta: 0, kapha: 0 };
      nextAnswers.forEach(ans => counts[ans]++);
      
      let dominant = 'vata';
      if (counts.pitta > counts[dominant]) dominant = 'pitta';
      if (counts.kapha > counts[dominant]) dominant = 'kapha';

      setDominantDosha(dominant);
      localStorage.setItem('user_dominant_dosha', dominant);
      setQuizStep(4);
      toast.success(`Complete! Your dominant Ayurvedic Dosha profile is: ${doshaProfiles[dominant].name}`, {
        icon: '🕉️',
        duration: 4000
      });
    }
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
    setQuizStep(1);
  };

  // Steeping Timer Controls
  const toggleBrewing = () => {
    setIsBrewing(!isBrewing);
  };

  const resetBrewing = () => {
    setIsBrewing(false);
    setBrewingTimeLeft(180);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '1.5rem' }} className="responsive-header">
        <div>
          <h1 className="gradient-text">Diet & Holistic <span className="accent">Nutrition</span></h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            Personalized yogic fuel matching **today's physical exertion** and ancient Ayurvedic sciences.
          </p>
        </div>
      </header>

      {/* Exertion Banner */}
      <div className="glass-panel" style={{ padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${exertionInfo.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>{exertionInfo.emoji}</span>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>TODAY'S EXERTION LEVEL</p>
            <h3 style={{ color: exertionInfo.color }}>{exertionInfo.label}</h3>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SESSIONS</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>{todaySessions.length}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DURATION</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--primary)' }}>
              {todayDuration > 60 ? `${Math.floor(todayDuration/60)}m` : `${todayDuration}s`}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVG ACCURACY</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--success)' }}>{todayAvgAccuracy}%</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CALORIES BURNED</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--danger)' }}>{caloriesBurned} kcal</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REC. DAILY INTAKE</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--warning)' }}>~{baseCalories} kcal</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1.1fr', gap: '1.5rem' }} className="responsive-grid">
        
        {/* LEFT COLUMN - Meals, Goals and Ayurveda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* INTERACTIVE GOALS & DIET PREFERENCE ADJUSTER */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>🎯 Personalized Yoga Nutrition Goal</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adjusts total calories & macro ratios to match your target focus.</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => setGoal('Vitality')}
                  className="btn"
                  style={{ 
                    background: goal === 'Vitality' ? 'var(--primary)' : 'var(--bg-surface-hover)', 
                    color: goal === 'Vitality' ? '#000' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    padding: '6px 12px',
                    fontSize: '0.78rem'
                  }}
                >
                  🧘 Balance
                </button>
                <button 
                  onClick={() => setGoal('Recovery')}
                  className="btn"
                  style={{ 
                    background: goal === 'Recovery' ? 'var(--primary)' : 'var(--bg-surface-hover)', 
                    color: goal === 'Recovery' ? '#000' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    padding: '6px 12px',
                    fontSize: '0.78rem'
                  }}
                >
                  ⚡ Deep Recovery
                </button>
                <button 
                  onClick={() => setGoal('Weight')}
                  className="btn"
                  style={{ 
                    background: goal === 'Weight' ? 'var(--primary)' : 'var(--bg-surface-hover)', 
                    color: goal === 'Weight' ? '#000' : 'var(--text-main)',
                    border: '1px solid var(--border)',
                    padding: '6px 12px',
                    fontSize: '0.78rem'
                  }}
                >
                  🔥 Weight Mgmt
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Diet Style</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Based on {preference} plan ({goal} mode)</p>
              </div>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Balanced">🍱 Balanced Diet</option>
                <option value="Vegan">🌱 Vegan Diet</option>
                <option value="Keto">🥩 Keto Diet</option>
              </select>
            </div>
          </div>

          {/* AI MEAL PLAN TIMELINE */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.2rem' }}>Today's AI Meal Plan</h2>

            {/* AI Reasoning */}
            <div style={{ padding: '1rem', background: 'rgba(212, 255, 79, 0.05)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary)' }}>
              🤖 <strong style={{ color: 'var(--primary)' }}>AI Nutritionist:</strong>{' '}
              {exertion === 'none' && "No sessions detected today. Showing a light maintenance plan. Start a session to unlock full exertion sync!"}
              {exertion === 'low' && `Detected ${todaySessions.length} low-exertion session(s) (${todayDuration}s). Recommended plan matches a light energy expenditure, customized for ${goal.toLowerCase()} goal.`}
              {exertion === 'moderate' && `Active yoga session of ${Math.floor(todayDuration/60)}m done. Adjusting proteins and nutrients to prevent muscle soreness and recover core strength.`}
              {exertion === 'high' && `Strong practice! ${todayAvgAccuracy}% accuracy in ${Math.floor(todayDuration/60)} minutes. Body is ready for maximum calorie loading and recovery nutrients!`}
            </div>

            {/* UPGRADED 4-MEAL TIMELINE FLOW */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '15px', bottom: '15px', width: '2px', background: 'var(--border)', zIndex: 1 }}></div>

              {/* Meal 1: Pre-Yoga */}
              <div style={{ display: 'flex', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 0 10px rgba(212,255,79,0.3)', flexShrink: 0, color: '#000' }}>
                  🌅
                </div>
                <div style={{ padding: '1.2rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', width: '100%' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Meal 1 • {plan.pre.title}</span>
                  <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{plan.pre.desc}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{plan.pre.why}</p>
                </div>
              </div>

              {/* Meal 2: Post-Yoga */}
              <div style={{ display: 'flex', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 0 10px rgba(74,222,128,0.3)', flexShrink: 0, color: '#000' }}>
                  🧘
                </div>
                <div style={{ padding: '1.2rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', borderLeft: '4px solid var(--success)', width: '100%' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '1px' }}>Meal 2 • {plan.post.title}</span>
                  <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{plan.post.desc}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{plan.post.why}</p>
                </div>
              </div>

              {/* Meal 3: Mid-Day Snack */}
              <div style={{ display: 'flex', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 0 10px rgba(163,163,163,0.3)', flexShrink: 0, color: '#000' }}>
                  ⚡
                </div>
                <div style={{ padding: '1.2rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', borderLeft: '4px solid var(--accent)', width: '100%' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Meal 3 • {plan.mid.title}</span>
                  <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{plan.mid.desc}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{plan.mid.why}</p>
                </div>
              </div>

              {/* Meal 4: Dinner */}
              <div style={{ display: 'flex', gap: '1.2rem', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 0 10px rgba(250,204,21,0.3)', flexShrink: 0, color: '#000' }}>
                  🌙
                </div>
                <div style={{ padding: '1.2rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', borderLeft: '4px solid var(--warning)', width: '100%' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '1px' }}>Meal 4 • {plan.dinner.title}</span>
                  <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{plan.dinner.desc}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{plan.dinner.why}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC SUPERFOODS SPOTLIGHT */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>✨ Yogic Superfoods Spotlight</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ayurvedic and modern functional foods matching your active exertion level.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }} className="responsive-grid">
              {superfoods[exertion].map((food, idx) => (
                <div key={idx} style={{ padding: '1.2rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{food.benefit}</span>
                  <h4 style={{ margin: '4px 0 8px 0', fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main)' }}>{food.name}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', marginTop: 'auto' }}>{food.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BRAND NEW INTERACTIVE AYURVEDIC DOSHA QUIZ CARD */}
          <div className="glass-panel" style={{ padding: '2.2rem 2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,255,79,0.06) 0%, transparent 70%)', zIndex: 1 }}></div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🕉️</span>
                <h2>Ayurvedic Mind-Body Constitution</h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Discover your custom genetic elemental balance (Dosha) to unlock deep dietary recommendations.
              </p>

              {/* QUIZ INTERACTIVE INTERFACE */}
              {quizStep === 0 && !dominantDosha && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', maxWidth: '400px', margin: '0 auto 1.2rem auto' }}>
                    Take our 3-question holistic assessment to identify whether you are primarily Vata, Pitta, or Kapha.
                  </p>
                  <button className="btn" onClick={() => setQuizStep(1)}>
                    Start Ayurvedic Assessment 📿
                  </button>
                </div>
              )}

              {quizStep > 0 && quizStep <= 3 && (
                <div style={{ background: 'var(--bg-surface-hover)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontWeight: 'bold' }}>
                    <span>QUESTION {quizStep} OF 3</span>
                    <span style={{ color: 'var(--primary)' }}>{Math.round(((quizStep - 1) / 3) * 100)}% COMPLETE</span>
                  </div>
                  
                  {/* Progress Line */}
                  <div style={{ width: '100%', height: '4px', background: 'var(--border)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ width: `${(quizStep / 3) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', lineHeight: '1.4', color: 'var(--text-main)' }}>
                    {doshaQuizQuestions[quizStep - 1].q}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {doshaQuizQuestions[quizStep - 1].options.map((opt, i) => (
                      <button
                        key={i}
                        className="btn btn-secondary"
                        onClick={() => handleQuizAnswer(opt.value)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          padding: '12px 16px',
                          fontSize: '0.85rem',
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border)',
                          fontWeight: '500'
                        }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DOSHA RESULT DISPLAY */}
              {(quizStep === 4 || dominantDosha) && (
                <div style={{ background: 'var(--bg-surface-hover)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${doshaProfiles[dominantDosha || 'vata'].color}`, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', right: '15px', top: '15px', fontSize: '0.7rem', fontWeight: 'bold', 
                    padding: '4px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)',
                    color: doshaProfiles[dominantDosha || 'vata'].color, border: `1px solid ${doshaProfiles[dominantDosha || 'vata'].color}`
                  }}>
                    DOMINANT PROFILE
                  </span>
                  
                  <h3 style={{ fontSize: '1.3rem', color: doshaProfiles[dominantDosha || 'vata'].color, marginBottom: '0.5rem' }}>
                    {doshaProfiles[dominantDosha || 'vata'].name}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    <span>Dietary Focus:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{doshaProfiles[dominantDosha || 'vata'].focus}</strong>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {doshaProfiles[dominantDosha || 'vata'].desc}
                  </p>

                  <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: '8px', borderLeft: `3px solid ${doshaProfiles[dominantDosha || 'vata'].color}`, marginBottom: '1rem', fontSize: '0.82rem' }}>
                    💡 <strong>Nutritional Guide:</strong> {doshaProfiles[dominantDosha || 'vata'].advice}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      🌿 Herbal Ally: <strong style={{ color: 'var(--text-main)' }}>{doshaProfiles[dominantDosha || 'vata'].ally}</strong>
                    </span>
                    <button className="btn btn-secondary" onClick={resetQuiz} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      Retake Assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Hydration, Macros, Grocery, Hourly Tea Brewer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Hydration Tracker */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Hydration</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Goal today: <strong style={{ color: 'var(--primary)' }}>{plan.water} glasses</strong>
            </p>

            <div style={{
              position: 'relative', width: '140px', height: '140px', borderRadius: '50%',
              background: `conic-gradient(var(--primary) ${(waterGlasses / plan.water) * 360}deg, var(--bg-surface-hover) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
            }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '700', color: 'var(--primary)', lineHeight: '1' }}>{waterGlasses}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>/ {plan.water} glasses</span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {waterGlasses >= plan.water ? '🏆 Daily goal reached!' : `${plan.water - waterGlasses} more glasses to go!`}
            </p>

            <button className="btn" onClick={() => setWaterGlasses(prev => prev < plan.water ? prev + 1 : prev)}
              style={{ width: '100%', justifyContent: 'center' }} disabled={waterGlasses >= plan.water}>
              + Add Glass 💧
            </button>
            <button className="btn btn-secondary" onClick={() => setWaterGlasses(0)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.8rem' }}>
              Reset
            </button>

            {/* Hydration dynamic advise */}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.8rem', width: '100%' }}>
              💡 {exertion === 'high' ? "Cramping risk is High. Add a pinch of pink salt to your water." : "Keep sipping water regularly to maintain peak muscle flexibility."}
            </p>
          </div>

          {/* DYNAMIC INTERACTIVE MACRONUTRIENT VISUALIZER */}
          <div className="glass-panel" style={{ padding: '1.8rem 1.5rem' }}>
            <h2 style={{ marginBottom: '0.4rem', fontSize: '1.15rem' }}>🎯 Goal Macro Splits</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>Recommended ratios for your {preference} diet</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Carbs Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', fontWeight: '500' }}>
                  <span>🍞 Carbs ({baseMacros.carbs}%)</span>
                  <span style={{ color: 'var(--primary)' }}>{carbGrams}g</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${baseMacros.carbs}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              {/* Protein Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', fontWeight: '500' }}>
                  <span>💪 Protein ({baseMacros.protein}%)</span>
                  <span style={{ color: 'var(--success)' }}>{proteinGrams}g</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${baseMacros.protein}%`, height: '100%', background: 'var(--success)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              {/* Fats Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', fontWeight: '500' }}>
                  <span>🥑 Fats ({baseMacros.fats}%)</span>
                  <span style={{ color: 'var(--warning)' }}>{fatGrams}g</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${baseMacros.fats}%`, height: '100%', background: 'var(--warning)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC BRAND NEW HOURLY HERBAL TEA BREWER CARD */}
          <div className="glass-panel" style={{ padding: '1.8rem 1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🫖</span>
              <h2 style={{ fontSize: '1.15rem' }}>Pranic Tea Brewer</h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Brew the perfect Ayurvedic infusion matched to your current hour of day.
            </p>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '8px' }}>
              {Object.keys(teaRecipes).map(time => (
                <button
                  key={time}
                  onClick={() => {
                    setActiveTeaTime(time);
                    resetBrewing();
                  }}
                  style={{
                    flex: 1, padding: '5px', borderRadius: '6px', border: 'none', fontSize: '0.72rem', cursor: 'pointer',
                    background: activeTeaTime === time ? 'var(--border)' : 'transparent',
                    color: activeTeaTime === time ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeTeaTime === time ? 'bold' : 'normal'
                  }}
                >
                  {teaRecipes[time].emoji} {time}
                </button>
              ))}
            </div>

            {/* Selected Tea Info */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface-hover)', borderRadius: '10px', borderLeft: '3px solid var(--primary)', marginBottom: '1.2rem' }}>
              <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '4px' }}>{teaRecipes[activeTeaTime].title}</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>
                🌟 {teaRecipes[activeTeaTime].benefit}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {teaRecipes[activeTeaTime].desc}
              </p>
            </div>

            {/* Steeping Timer Interface */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
              
              {/* Steeping Cup Illustration (steaming cup SVG/CSS) */}
              <div style={{ position: 'relative', width: '50px', height: '40px', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                {/* Steaming lines */}
                {isBrewing && (
                  <div style={{ position: 'absolute', top: '-15px', display: 'flex', gap: '5px', animation: 'fadeIn 1s infinite alternate' }}>
                    <span style={{ width: '2px', height: '12px', background: 'var(--primary)', borderRadius: '1px', display: 'inline-block', opacity: 0.7, transform: 'skewX(-10deg)' }}></span>
                    <span style={{ width: '2px', height: '12px', background: 'var(--primary)', borderRadius: '1px', display: 'inline-block', opacity: 0.7, transform: 'skewX(10deg)' }}></span>
                    <span style={{ width: '2px', height: '12px', background: 'var(--primary)', borderRadius: '1px', display: 'inline-block', opacity: 0.7, transform: 'skewX(-5deg)' }}></span>
                  </div>
                )}
                {/* Cup Body */}
                <div style={{ width: '36px', height: '26px', border: '3px solid var(--text-main)', borderTop: 'none', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', marginTop: '5px', position: 'relative' }}>
                  {/* Handle */}
                  <div style={{ width: '10px', height: '12px', border: '3px solid var(--text-main)', borderLeft: 'none', borderRadius: '0 8px 8px 0', position: 'absolute', right: '-12px', top: '2px' }}></div>
                  {/* Water inside */}
                  <div style={{ 
                    position: 'absolute', bottom: '2px', left: '2px', right: '2px', 
                    height: isBrewing ? '16px' : '6px', 
                    background: 'var(--primary-dim)', 
                    borderRadius: '0 0 8px 8px',
                    transition: 'height 2s ease'
                  }}></div>
                </div>
              </div>

              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace', color: isBrewing ? 'var(--primary)' : 'var(--text-main)', letterSpacing: '1px' }}>
                {formatTime(brewingTimeLeft)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '2px' }}>
                {isBrewing ? "Steeping ingredients in hot water..." : brewingTimeLeft === 0 ? "Elixir Steeping Complete!" : "Recommended Steeping: 3 Minutes"}
              </span>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button 
                  onClick={toggleBrewing}
                  className="btn"
                  style={{ 
                    flex: 2, justifyContent: 'center', padding: '8px', fontSize: '0.78rem',
                    background: isBrewing ? 'var(--warning)' : 'var(--primary)',
                    color: '#000'
                  }}
                  disabled={brewingTimeLeft === 0}
                >
                  {isBrewing ? "Pause Steeping ⏸️" : "Start Steeping ▶️"}
                </button>
                <button 
                  onClick={resetBrewing}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC INTERACTIVE WEEKLY GROCERY CHECKLIST */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem' }}>🛒 Shopping List</h2>
              <button 
                onClick={() => setIsGroceryOpen(!isGroceryOpen)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}
              >
                {isGroceryOpen ? 'Hide' : 'Expand'}
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: isGroceryOpen ? '1rem' : '0' }}>Curated weekly ingredients based on {preference} plan</p>
            
            {isGroceryOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem', animation: 'fadeIn 0.2s' }}>
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {plan.grocery.map((item, idx) => (
                    <label 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        fontSize: '0.8rem', 
                        color: checkedGroceryItems[item] ? 'var(--text-muted)' : 'var(--text-main)', 
                        textDecoration: checkedGroceryItems[item] ? 'line-through' : 'none',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        background: checkedGroceryItems[item] ? 'transparent' : 'var(--bg-surface-hover)',
                        borderRadius: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={!!checkedGroceryItems[item]} 
                        onChange={() => toggleGroceryItem(item)}
                        style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <button 
                  onClick={copyGroceryList}
                  style={{ width: '100%', padding: '8px', fontSize: '0.78rem', marginTop: '8px' }}
                  className="btn btn-secondary"
                >
                  📋 Copy List to Clipboard
                </button>
              </div>
            )}
          </div>

          {/* Today's session list */}
          {todaySessions.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>TODAY'S SESSIONS</p>
              {todaySessions.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{s.asana.replace(/_/g, ' ')}</span>
                  <span style={{ color: s.accuracy > 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>{s.accuracy}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DietRecommendations;
