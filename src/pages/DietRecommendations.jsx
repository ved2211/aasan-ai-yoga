import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { subscribeToUserSessions } from '../utils/userData';

// ─── Diet Plans by preference AND exertion level ─────────────────────────────
const dietPlans = {
  Balanced: {
    none:     { pre: { title: "Pre-Yoga Snack", desc: "1 Banana + Handful of Almonds", why: "Quick carbs and minerals to fuel your upcoming session." }, post: { title: "Post-Yoga Meal", desc: "Dal Chawal + Salad", why: "Light balanced meal to keep energy stable." }, calories: "~400 kcal", water: 6 },
    low:      { pre: { title: "Pre-Yoga Snack", desc: "1 Banana + Handful of Almonds", why: "Quick carbs and minerals to fuel your session." }, post: { title: "Post-Yoga Recovery", desc: "Roti + Sabzi + Curd", why: "Balanced carbs and protein to restore mild energy expenditure." }, calories: "~600 kcal", water: 7 },
    moderate: { pre: { title: "Pre-Yoga Snack", desc: "Oats with Honey + Dates", why: "Sustained energy release for a moderate-intensity flow." }, post: { title: "Post-Yoga Recovery", desc: "Grilled Chicken + Brown Rice + Salad", why: "High protein and complex carbs to restore energy after moderate exertion." }, calories: "~800 kcal", water: 8 },
    high:     { pre: { title: "Pre-Yoga Power Meal", desc: "Boiled Eggs + Brown Bread + OJ", why: "High protein and fast carbs for intense session." }, post: { title: "Post-Yoga Protein Boost", desc: "Paneer Tikka + Quinoa + Coconut Water", why: "Maximum protein, electrolytes and anti-inflammatory foods for full recovery." }, calories: "~1100 kcal", water: 10 }
  },
  Vegan: {
    none:     { pre: { title: "Pre-Yoga Snack", desc: "Apple Slices + Peanut Butter", why: "Plant-based energy with healthy fats." }, post: { title: "Post-Yoga Meal", desc: "Moong Dal + Rice", why: "Light complete protein to nourish the body." }, calories: "~400 kcal", water: 6 },
    low:      { pre: { title: "Pre-Yoga Snack", desc: "Apple + Peanut Butter", why: "Plant-based energy with healthy fats." }, post: { title: "Post-Yoga Recovery", desc: "Lentil Soup + Whole Grain Bread", why: "Rich in plant protein and iron." }, calories: "~550 kcal", water: 7 },
    moderate: { pre: { title: "Pre-Yoga Snack", desc: "Smoothie: Banana + Oat Milk + Chia Seeds", why: "Dense plant-based energy for moderate intensity." }, post: { title: "Post-Yoga Recovery", desc: "Tofu Scramble + Spinach + Brown Rice", why: "Complete plant protein and iron to aid recovery." }, calories: "~750 kcal", water: 8 },
    high:     { pre: { title: "Pre-Yoga Power Smoothie", desc: "Pea Protein Shake + Dates + Almond Milk", why: "Maximum plant protein before a high-intensity session." }, post: { title: "Post-Yoga Recovery Bowl", desc: "Chickpea Bowl + Avocado + Sweet Potato", why: "Electrolytes, protein and anti-inflammatory fats for full plant-based recovery." }, calories: "~1000 kcal", water: 10 }
  },
  Keto: {
    none:     { pre: { title: "Pre-Yoga Snack", desc: "Half Avocado + Sea Salt", why: "Healthy fats and electrolytes for low-carb energy." }, post: { title: "Post-Yoga Meal", desc: "Eggs + Cheese + Greens", why: "Keto-friendly protein and fats." }, calories: "~500 kcal", water: 7 },
    low:      { pre: { title: "Pre-Yoga Snack", desc: "Half Avocado with Sea Salt", why: "Healthy fats and electrolytes for low-carb energy." }, post: { title: "Post-Yoga Recovery", desc: "Grilled Salmon + Asparagus + Butter", why: "Omega-3s and protein for joint health and muscle repair." }, calories: "~700 kcal", water: 8 },
    moderate: { pre: { title: "Pre-Yoga Fuel", desc: "MCT Oil Coffee + Boiled Eggs", why: "Fast fat-based energy for sustained keto flow." }, post: { title: "Post-Yoga Recovery", desc: "Grilled Chicken Thighs + Broccoli + Olive Oil", why: "High protein and healthy fats to repair muscle tissue." }, calories: "~900 kcal", water: 8 },
    high:     { pre: { title: "Pre-Yoga Keto Power", desc: "Protein Shake (Whey) + MCT Oil", why: "Maximum fat-fueled energy for a high-intensity session." }, post: { title: "Post-Yoga Full Recovery", desc: "Ribeye Steak + Roasted Vegetables + Avocado", why: "Maximum protein and healthy fats to fully restore after high exertion." }, calories: "~1200 kcal", water: 10 }
  }
};

// ─── Calculate exertion from today's sessions ─────────────────────────────────
const getExertionLevel = (todaySessions) => {
  if (todaySessions.length === 0) return 'none';
  const totalDuration = todaySessions.reduce((s, x) => s + x.duration, 0);
  const avgAccuracy = todaySessions.reduce((s, x) => s + x.accuracy, 0) / todaySessions.length;
  
  // High: > 20 min OR very high accuracy (very active practice)
  if (totalDuration > 1200 || avgAccuracy > 80) return 'high';
  // Moderate: 5-20 min
  if (totalDuration > 300) return 'moderate';
  // Low: anything else
  return 'low';
};

// ─── Dynamic calorie calculator based on real duration ────────────────────────
// Yoga burns ~3.5 cal/min (light) to ~7 cal/min (vigorous)
const getCalorieData = (todaySessions) => {
  const totalDuration = todaySessions.reduce((s, x) => s + x.duration, 0); // in seconds
  const avgAccuracy = todaySessions.length > 0
    ? todaySessions.reduce((s, x) => s + x.accuracy, 0) / todaySessions.length : 0;
  const durationMins = totalDuration / 60;

  // Calorie burn rate based on accuracy (intensity proxy)
  const burnRate = avgAccuracy > 80 ? 7 : avgAccuracy > 50 ? 5 : 3.5; // cal/min
  const caloriesBurned = Math.round(durationMins * burnRate);

  // Recommended post-workout meal: base (400) + 2x calories burned, capped reasonably
  const baseCalories = 400;
  const recommendedMeal = Math.min(1200, Math.round(baseCalories + caloriesBurned * 2));

  return { caloriesBurned, recommendedMeal, durationMins: durationMins.toFixed(1) };
};

const exertionLabels = {
  none: { label: 'No Sessions Today', color: 'var(--text-muted)', emoji: '😴' },
  low: { label: 'Low Exertion', color: 'var(--primary)', emoji: '🧘' },
  moderate: { label: 'Moderate Exertion', color: 'var(--warning)', emoji: '💪' },
  high: { label: 'High Exertion', color: 'var(--danger)', emoji: '🔥' }
};

const DietRecommendations = () => {
  const [preference, setPreference] = useState('Balanced');
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [sessions, setSessions] = useState([]);

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
  const { caloriesBurned, recommendedMeal } = getCalorieData(todaySessions);

  // Stats for today
  const todayDuration = todaySessions.reduce((s, x) => s + x.duration, 0);
  const todayAvgAccuracy = todaySessions.length > 0
    ? Math.round(todaySessions.reduce((s, x) => s + x.accuracy, 0) / todaySessions.length) : 0;

  return (
    <div className="container animate-fade-in">
      <header style={{ marginBottom: '2rem' }} className="responsive-header">
        <div>
          <h1 className="gradient-text">Diet & Nutrition Plan</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            Personalized recommendations based on <strong>today's real yoga session data</strong>.
          </p>
        </div>
      </header>

      {/* Today's Activity Summary Banner */}
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MEAL RECOMMENDED</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--warning)' }}>~{recommendedMeal} kcal</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }} className="responsive-grid">
        {/* Left Column - Meal Plan */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
            <h2>Today's AI Meal Plan</h2>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Balanced">🍱 Balanced</option>
              <option value="Vegan">🌱 Vegan</option>
              <option value="Keto">🥩 Keto</option>
            </select>
          </div>

          {/* AI Reasoning */}
          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary)' }}>
            🤖 <strong style={{ color: 'var(--primary)' }}>AI Analysis:</strong>{' '}
            {exertion === 'none' && "No yoga sessions detected today. Showing a light maintenance plan. Start a session to get personalized recommendations!"}
            {exertion === 'low' && `You've done ${todaySessions.length} light session(s) today (${todayDuration}s). A moderate recovery meal is recommended.`}
            {exertion === 'moderate' && `You've practiced for ${Math.floor(todayDuration/60)} minutes with ${todayAvgAccuracy}% accuracy. Your body needs a solid recovery meal.`}
            {exertion === 'high' && `Excellent session! ${todayAvgAccuracy}% avg accuracy in ${Math.floor(todayDuration/60)} minutes of practice. You need maximum nutrition for full recovery!`}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{plan.pre.title}</h3>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.05rem' }}>{plan.pre.desc}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.pre.why}</p>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--bg-surface-hover)', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
              <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{plan.post.title}</h3>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.05rem' }}>{plan.post.desc}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.post.why}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Hydration Tracker */}
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

          {/* Today's session list */}
          {todaySessions.length > 0 && (
            <div style={{ marginTop: '1.5rem', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.7rem' }}>TODAY'S SESSIONS</p>
              {todaySessions.slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ textTransform: 'capitalize' }}>{s.asana.replace(/_/g, ' ')}</span>
                  <span style={{ color: s.accuracy > 80 ? 'var(--success)' : 'var(--warning)' }}>{s.accuracy}%</span>
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
