import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Activity, Target, Zap, Flame, Award, Medal, Crown } from 'lucide-react';
import { auth } from '../firebase';
import { subscribeToUserSessions } from '../utils/userData';
import ParticleBackground from '../components/ParticleBackground';
import './Dashboard.css';

const ASANA_NAMES = {
  tadasana: 'Tadasana', vrikshasana: 'Vrikshasana', bhujangasana: 'Bhujangasana',
  trikonasana: 'Trikonasana', padmasana: 'Padmasana', vajrasana: 'Vajrasana',
  adho_mukha_svanasana: 'Adho Mukha Svanasana', paschimottanasana: 'Paschimottanasana',
  setu_bandhasana: 'Setu Bandhasana', shavasana: 'Shavasana',
  surya_namaskar: 'Surya Namaskar', naukasana: 'Naukasana'
};

// Calculate the current practice streak (consecutive days)
const calculateStreak = (sessions) => {
  if (sessions.length === 0) return 0;
  const uniqueDays = [...new Set(sessions.map(s => new Date(s.date).toDateString()))];
  uniqueDays.sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const day of uniqueDays) {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    const diff = (currentDate - d) / (1000 * 60 * 60 * 24);
    if (diff <= 1) { streak++; currentDate = d; }
    else break;
  }
  return streak;
};

// Find the weakest pose (lowest avg accuracy among practiced poses)
const getWeakestPose = (sessions) => {
  if (sessions.length === 0) return null;
  const poseScores = {};
  sessions.forEach(s => {
    if (!poseScores[s.asana]) poseScores[s.asana] = { total: 0, count: 0 };
    poseScores[s.asana].total += s.accuracy;
    poseScores[s.asana].count += 1;
  });
  const weakest = Object.entries(poseScores)
    .map(([id, v]) => ({ id, avg: Math.round(v.total / v.count) }))
    .sort((a, b) => a.avg - b.avg)[0];
  return weakest;
};

// Format time relative to now
const timeAgo = (isoDate) => {
  const diff = (Date.now() - new Date(isoDate)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return `${Math.floor(diff / 86400)}d ago`;
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let firestoreUnsub = () => {};
    const authUnsub = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      firestoreUnsub();
      if (currentUser) {
        firestoreUnsub = subscribeToUserSessions(setSessions);
      }
    });
    return () => { authUnsub(); firestoreUnsub(); };
  }, []);

  // Computed stats
  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + x.accuracy, 0) / sessions.length)
    : 0;

  const totalDuration = sessions.reduce((s, x) => s + x.duration, 0);
  const totalTimeStr = totalDuration < 60 ? `${totalDuration}s`
    : totalDuration < 3600 ? `${Math.floor(totalDuration / 60)}m`
    : `${(totalDuration / 3600).toFixed(1)}h`;

  const streak = calculateStreak(sessions);
  const weakest = getWeakestPose(sessions);
  const recentSessions = sessions.slice(0, 5);

  // AI recommendation based on weakest pose
  let recommendation = { title: 'Start Your Journey', body: 'You have not practiced yet! Start your first session to get a personalized AI recommendation.', pose: null };
  if (weakest) {
    if (weakest.avg < 60) {
      recommendation = { title: 'Focus on Fundamentals', body: `Your ${ASANA_NAMES[weakest.id] || weakest.id} needs the most work (avg ${weakest.avg}% accuracy). Practice it today for 5 minutes to improve your form.`, pose: ASANA_NAMES[weakest.id] };
    } else if (weakest.avg < 80) {
      recommendation = { title: 'Keep Refining', body: `You're making progress! Your ${ASANA_NAMES[weakest.id] || weakest.id} is at ${weakest.avg}%. Try holding the pose for longer to improve balance.`, pose: ASANA_NAMES[weakest.id] };
    } else {
      recommendation = { title: 'Outstanding Progress!', body: 'All your poses are above 80%! Push yourself further with a full Sun Salutation (Surya Namaskar) sequence today.', pose: 'surya_namaskar' };
    }
  }

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Yogi';
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <>
    <ParticleBackground />
    <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="gradient-text">{greeting}, {firstName}.</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            {sessions.length > 0 ? `You have completed ${sessions.length} sessions.` : 'Ready for your first AI-guided yoga session?'}
          </p>
        </div>
        <Link to="/session" className="btn start-btn">
          <Play fill="currentColor" size={18} />
          Start Session
        </Link>
      </header>

      {/* Live Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>Avg AI Accuracy</h3>
            <div className="stat-value" style={{ color: avgAccuracy > 80 ? 'var(--success)' : avgAccuracy > 50 ? 'var(--warning)' : 'var(--danger)' }}>
              {avgAccuracy}%
            </div>
            <div className="stat-trend positive">{avgAccuracy > 80 ? 'Excellent posture alignment' : avgAccuracy > 0 ? 'Consistent practice recommended' : 'No sessions recorded'}</div>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>Sessions Completed</h3>
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-trend">Total time: {totalTimeStr}</div>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <h3>Practice Streak</h3>
            <div className="stat-value">{streak} Days</div>
            <div className="stat-trend">{streak > 0 ? `${streak} consecutive practice day${streak > 1 ? 's' : ''}` : 'Begin your streak today'}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Activity — REAL data */}
        <div className="recent-activity glass-panel">
          <h2 style={{ marginBottom: '1.2rem' }}>Recent Activity</h2>
          {recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <p>No sessions yet. <Link to="/session" style={{ color: 'var(--primary)' }}>Start practicing!</Link></p>
            </div>
          ) : (
            <div className="activity-list">
              {recentSessions.map((s, i) => (
                <div className="activity-item" key={i}>
                  <div className="activity-indicator" style={{
                    background: s.accuracy > 80 ? 'var(--success)' : s.accuracy > 50 ? 'var(--warning)' : 'var(--danger)'
                  }}></div>
                  <div className="activity-details">
                    <h4>{ASANA_NAMES[s.asana] || s.asana}</h4>
                    <p>{s.duration}s • {s.accuracy}% accuracy</p>
                  </div>
                  <div className="activity-time">{timeAgo(s.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendation — based on REAL weakest pose */}
        <div className="recommendations glass-panel">
          <h2 style={{ marginBottom: '1.2rem' }}>
            <Award size={20} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent)' }} />
            AI Recommendation
          </h2>
          <div className="rec-card">
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{recommendation.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>{recommendation.body}</p>
            <Link
              to="/session"
              className="btn btn-secondary"
              style={{ marginTop: '1rem', display: 'inline-flex' }}
            >
              {recommendation.pose ? `Practice ${ASANA_NAMES[recommendation.pose] || recommendation.pose}` : 'Begin Session'}
            </Link>
          </div>

          {/* Mini accuracy breakdown */}
          {sessions.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>ACCURACY BREAKDOWN</h4>
              {Object.entries(
                sessions.reduce((acc, s) => {
                  if (!acc[s.asana]) acc[s.asana] = { total: 0, count: 0 };
                  acc[s.asana].total += s.accuracy;
                  acc[s.asana].count++;
                  return acc;
                }, {})
              ).slice(0, 4).map(([id, v]) => {
                const avg = Math.round(v.total / v.count);
                return (
                  <div key={id} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '3px' }}>
                      <span>{ASANA_NAMES[id] || id}</span>
                      <span style={{ color: avg > 80 ? 'var(--success)' : avg > 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: '600' }}>{avg}%</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${avg}%`, height: '100%', background: avg > 80 ? 'var(--success)' : avg > 50 ? 'var(--warning)' : 'var(--danger)', transition: 'width 0.5s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* CLINICAL MILESTONES: Performance Milestones */}
    <div className="container" style={{ paddingTop: '0', paddingBottom: '3rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 'bold' }}>
          Milestone Tracking
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          
          {/* First Session Badge */}
          <div style={{ 
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1.2rem',
            opacity: sessions.length > 0 ? 1 : 0.4,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', flexShrink: 0 }}>
              <Zap size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Initiation Milestone</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>First complete active session</p>
            </div>
          </div>

          {/* 7-Day Streak Badge */}
          <div style={{ 
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1.2rem',
            opacity: streak >= 7 ? 1 : 0.4,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', flexShrink: 0 }}>
              <Activity size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Consistency Milestone</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>7-day practice streak</p>
            </div>
          </div>

          {/* Perfect Form Badge */}
          <div style={{ 
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1.2rem',
            opacity: sessions.some(s => s.accuracy > 95) ? 1 : 0.4,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
              <Target size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Precision Milestone</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Achieved &gt;95% pose accuracy</p>
            </div>
          </div>
          
          {/* Dedicated Yogi Badge */}
          <div style={{ 
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: '10px', padding: '1.2rem',
            opacity: sessions.length >= 20 ? 1 : 0.4,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
              <Award size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Commitment Milestone</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Logged 20 completed sessions</p>
            </div>
          </div>

        </div>
      </div>
    </div>

    </>
  );
};

export default Dashboard;
