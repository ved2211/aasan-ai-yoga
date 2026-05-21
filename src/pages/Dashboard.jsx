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
      <header className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 className="gradient-text">{greeting}, {firstName}.</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            {sessions.length > 0 ? `You have completed ${sessions.length} clinical sessions.` : 'Ready for your first AI-guided yoga practice?'}
          </p>
        </div>
        <Link to="/session" className="btn" style={{
          background: 'rgba(212, 255, 79, 0.15)',
          color: 'var(--primary)',
          border: '1px solid rgba(212, 255, 79, 0.4)',
          borderRadius: '8px',
          padding: '8px 18px',
          fontSize: '0.82rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          boxShadow: 'none',
          textDecoration: 'none'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(212, 255, 79, 0.25)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(212, 255, 79, 0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <Play fill="currentColor" size={12} />
          Start Session
        </Link>
      </header>

      {/* Live Stat Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Card 1: Avg Accuracy */}
        <div className="stat-card glass-panel" style={{
          borderLeft: `4px solid ${avgAccuracy > 80 ? 'var(--success)' : avgAccuracy > 50 ? 'var(--warning)' : avgAccuracy > 0 ? 'var(--danger)' : 'var(--border)'}`,
          background: `linear-gradient(to right, ${avgAccuracy > 80 ? 'rgba(74, 222, 128, 0.02)' : avgAccuracy > 50 ? 'rgba(250, 204, 21, 0.02)' : avgAccuracy > 0 ? 'rgba(248, 113, 113, 0.02)' : 'rgba(38, 38, 38, 0.02)'}, var(--bg-surface-hover))`,
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          borderRadius: '12px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = `0 12px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px ${avgAccuracy > 80 ? 'rgba(74, 222, 128, 0.1)' : avgAccuracy > 50 ? 'rgba(250, 204, 21, 0.1)' : 'rgba(248, 113, 113, 0.1)'}`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px -8px rgba(0, 0, 0, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: avgAccuracy > 80 ? 'rgba(74, 222, 128, 0.1)' : avgAccuracy > 50 ? 'rgba(250, 204, 21, 0.1)' : avgAccuracy > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(38, 38, 38, 0.1)',
            border: `1px solid ${avgAccuracy > 80 ? 'rgba(74, 222, 128, 0.2)' : avgAccuracy > 50 ? 'rgba(250, 204, 21, 0.2)' : avgAccuracy > 0 ? 'rgba(248, 113, 113, 0.2)' : 'rgba(38, 38, 38, 0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: avgAccuracy > 80 ? 'var(--success)' : avgAccuracy > 50 ? 'var(--warning)' : avgAccuracy > 0 ? 'var(--danger)' : 'var(--text-muted)',
            flexShrink: 0
          }}>
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <h3 style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>Avg AI Accuracy</h3>
            <div className="stat-value" style={{
              fontSize: '1.6rem',
              fontWeight: '800',
              color: avgAccuracy > 80 ? 'var(--success)' : avgAccuracy > 50 ? 'var(--warning)' : avgAccuracy > 0 ? 'var(--danger)' : 'var(--text-main)'
            }}>
              {avgAccuracy}%
            </div>
            <div className="stat-trend" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {avgAccuracy > 80 ? 'Optimal alignment detected' : avgAccuracy > 0 ? 'Consistent practice recommended' : 'No logs recorded'}
            </div>
          </div>
        </div>

        {/* Card 2: Sessions Completed */}
        <div className="stat-card glass-panel" style={{
          borderLeft: '4px solid #6366f1',
          background: 'linear-gradient(to right, rgba(99, 102, 241, 0.02), var(--bg-surface-hover))',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          borderRadius: '12px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px rgba(99, 102, 241, 0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px -8px rgba(0, 0, 0, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1',
            flexShrink: 0
          }}>
            <Target size={20} />
          </div>
          <div className="stat-content">
            <h3 style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>Sessions Completed</h3>
            <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {sessions.length}
            </div>
            <div className="stat-trend" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Practice volume: {totalTimeStr}
            </div>
          </div>
        </div>

        {/* Card 3: Practice Streak */}
        <div className="stat-card glass-panel" style={{
          borderLeft: '4px solid #fb923c',
          background: 'linear-gradient(to right, rgba(251, 146, 60, 0.02), var(--bg-surface-hover))',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.2rem',
          borderRadius: '12px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px rgba(251, 146, 60, 0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px -8px rgba(0, 0, 0, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fb923c',
            flexShrink: 0
          }}>
            <Flame size={20} />
          </div>
          <div className="stat-content">
            <h3 style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>Practice Streak</h3>
            <div className="stat-value" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {streak} Days
            </div>
            <div className="stat-trend" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {streak > 0 ? `${streak} day active cycle` : 'Initiate a regular practice'}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Recent Activity — REAL data */}
        <div className="recent-activity glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{
            fontSize: '0.72rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            Recent Practice Activity
          </h2>
          {recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.85rem' }}>No sessions yet. <Link to="/session" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Start practicing!</Link></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '15px', bottom: '15px', width: '1px', background: 'var(--border)', zIndex: 1 }}></div>
              {recentSessions.map((s, i) => {
                const color = s.accuracy > 80 ? 'var(--success)' : s.accuracy > 50 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div style={{ display: 'flex', gap: '1.2rem', position: 'relative', zIndex: 2 }} key={i}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: s.accuracy > 80 ? 'rgba(74, 222, 128, 0.1)' : s.accuracy > 50 ? 'rgba(250, 204, 21, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                      border: `1px solid ${s.accuracy > 80 ? 'rgba(74, 222, 128, 0.3)' : s.accuracy > 50 ? 'rgba(250, 204, 21, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: color,
                      flexShrink: 0,
                      boxShadow: `0 0 10px ${s.accuracy > 80 ? 'rgba(74, 222, 128, 0.05)' : s.accuracy > 50 ? 'rgba(250, 204, 21, 0.05)' : 'rgba(248, 113, 113, 0.05)'}`
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{
                      padding: '1.2rem',
                      background: `linear-gradient(to right, ${s.accuracy > 80 ? 'rgba(74, 222, 128, 0.03)' : s.accuracy > 50 ? 'rgba(250, 204, 21, 0.03)' : 'rgba(248, 113, 113, 0.03)'}, var(--bg-surface-hover))`,
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${color}`,
                      width: '100%',
                      transition: 'all 0.25s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          SESSION {sessions.length - i}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(s.date)}</span>
                      </div>
                      <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>{ASANA_NAMES[s.asana] || s.asana}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        Duration: <strong style={{ color: 'var(--text-main)' }}>{s.duration}s</strong> • Alignment Precision: <strong style={{ color: color }}>{s.accuracy}%</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Recommendation — based on REAL weakest pose */}
        <div className="recommendations glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #38bdf8', background: 'linear-gradient(to bottom right, rgba(56, 189, 248, 0.02), var(--bg-surface))', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{
            fontSize: '0.72rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Award size={16} style={{ color: '#38bdf8' }} />
            AI Diagnostic Feedback
          </h2>
          <div className="rec-card" style={{ padding: '1.2rem', background: 'linear-gradient(to right, rgba(56, 189, 248, 0.03), var(--bg-surface-hover))', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Prescription</span>
            <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{recommendation.title}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.2rem' }}>{recommendation.body}</p>
            <Link
              to="/session"
              className="btn"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Play fill="currentColor" size={12} />
              {recommendation.pose ? `Practice ${ASANA_NAMES[recommendation.pose] || recommendation.pose}` : 'Begin Practice'}
            </Link>
          </div>

          {/* Mini accuracy breakdown */}
          {sessions.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem', fontWeight: 'bold' }}>Physiological Profile by Asana</h4>
              {Object.entries(
                sessions.reduce((acc, s) => {
                  if (!acc[s.asana]) acc[s.asana] = { total: 0, count: 0 };
                  acc[s.asana].total += s.accuracy;
                  acc[s.asana].count++;
                  return acc;
                }, {})
              ).slice(0, 4).map(([id, v]) => {
                const avg = Math.round(v.total / v.count);
                const color = avg > 80 ? 'var(--success)' : avg > 50 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{ASANA_NAMES[id] || id}</span>
                      <span style={{ color: color, fontWeight: '600' }}>{avg}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ width: `${avg}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
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
    <div className="container" style={{ paddingTop: '0', paddingBottom: '3.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1.25rem', fontWeight: 'bold' }}>
          Physiological Milestone Tracking
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          
          {/* Initiation Milestone */}
          {(() => {
            const unlocked = sessions.length > 0;
            return (
              <div style={{ 
                background: unlocked ? 'linear-gradient(to bottom right, rgba(74, 222, 128, 0.02), var(--bg-surface))' : 'var(--bg-surface-hover)',
                border: unlocked ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1.2rem',
                opacity: unlocked ? 1 : 0.35,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: unlocked ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: unlocked ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: unlocked ? 'var(--success)' : 'var(--text-muted)',
                  flexShrink: 0
                }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Initiation Milestone</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>First complete active session</p>
                </div>
              </div>
            );
          })()}

          {/* Consistency Milestone */}
          {(() => {
            const unlocked = streak >= 7;
            return (
              <div style={{ 
                background: unlocked ? 'linear-gradient(to bottom right, rgba(250, 204, 21, 0.02), var(--bg-surface))' : 'var(--bg-surface-hover)',
                border: unlocked ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1.2rem',
                opacity: unlocked ? 1 : 0.35,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: unlocked ? 'rgba(250, 204, 21, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: unlocked ? '1px solid rgba(250, 204, 21, 0.2)' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: unlocked ? 'var(--warning)' : 'var(--text-muted)',
                  flexShrink: 0
                }}>
                  <Activity size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Consistency Milestone</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>7-day practice streak</p>
                </div>
              </div>
            );
          })()}

          {/* Precision Milestone */}
          {(() => {
            const unlocked = sessions.some(s => s.accuracy > 95);
            return (
              <div style={{ 
                background: unlocked ? 'linear-gradient(to bottom right, rgba(56, 189, 248, 0.02), var(--bg-surface))' : 'var(--bg-surface-hover)',
                border: unlocked ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1.2rem',
                opacity: unlocked ? 1 : 0.35,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: unlocked ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: unlocked ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: unlocked ? '#38bdf8' : 'var(--text-muted)',
                  flexShrink: 0
                }}>
                  <Target size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Precision Milestone</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Achieved &gt;95% pose accuracy</p>
                </div>
              </div>
            );
          })()}
          
          {/* Commitment Milestone */}
          {(() => {
            const unlocked = sessions.length >= 20;
            return (
              <div style={{ 
                background: unlocked ? 'linear-gradient(to bottom right, rgba(167, 139, 250, 0.02), var(--bg-surface))' : 'var(--bg-surface-hover)',
                border: unlocked ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1.2rem',
                opacity: unlocked ? 1 : 0.35,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: unlocked ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: unlocked ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: unlocked ? '#a78bfa' : 'var(--text-muted)',
                  flexShrink: 0
                }}>
                  <Award size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>Commitment Milestone</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Logged 20 completed sessions</p>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
