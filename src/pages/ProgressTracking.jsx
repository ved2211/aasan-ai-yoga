import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
  PieChart, Pie
} from 'recharts';
import { auth } from '../firebase';
import { subscribeToUserSessions, generateChartData } from '../utils/userData';

const ASANA_NAMES = {
  tadasana: 'Tadasana', vrikshasana: 'Vrikshasana', bhujangasana: 'Bhujangasana',
  trikonasana: 'Trikonasana', padmasana: 'Padmasana', vajrasana: 'Vajrasana',
  adho_mukha_svanasana: 'Adho Mukha', paschimottanasana: 'Paschimottanasana',
  setu_bandhasana: 'Setu Bandha', shavasana: 'Shavasana',
  surya_namaskar: 'Surya Namaskar', naukasana: 'Naukasana'
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#a78bfa', '#fb923c'];

const tooltipStyle = {
  contentStyle: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' },
  itemStyle: { color: 'var(--text-main)' }
};

const EmptyState = ({ message }) => (
  <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
    <p>{message}</p>
  </div>
);

const ProgressTracking = () => {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let firestoreUnsubscribe = () => {};

    const authUnsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      // Clean up any previous Firestore listener
      firestoreUnsubscribe();

      if (currentUser) {
        setLoading(true);
        // Subscribe to real-time updates from Firestore
        firestoreUnsubscribe = subscribeToUserSessions((data) => {
          setSessions(data);
          setLoading(false);
        });
      } else {
        setSessions([]);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      firestoreUnsubscribe();
    };
  }, []);

  const chartData = generateChartData(sessions);

  // --- Aggregates ---
  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length) : 0;

  const totalDurationSeconds = Math.round(sessions.reduce((sum, s) => sum + s.duration, 0));
  let totalTimeStr = '0s';
  if (totalDurationSeconds > 0 && totalDurationSeconds < 60) totalTimeStr = `${totalDurationSeconds}s`;
  else if (totalDurationSeconds >= 60 && totalDurationSeconds < 3600) {
    totalTimeStr = `${Math.floor(totalDurationSeconds / 60)}m ${totalDurationSeconds % 60}s`;
  } else if (totalDurationSeconds >= 3600) totalTimeStr = `${(totalDurationSeconds / 3600).toFixed(1)}h`;

  let bestPose = 'None Yet';
  if (sessions.length > 0) {
    const poseScores = {};
    sessions.forEach(s => { if (!poseScores[s.asana] || s.accuracy > poseScores[s.asana]) poseScores[s.asana] = s.accuracy; });
    bestPose = Object.keys(poseScores).reduce((a, b) => poseScores[a] > poseScores[b] ? a : b);
  }

  // --- Radar Chart Data: accuracy per pose (all 12 poses, 0 if not practiced) ---
  const radarData = Object.entries(ASANA_NAMES).map(([id, label]) => {
    const poseSessions = sessions.filter(s => s.asana === id);
    const avg = poseSessions.length > 0 ? Math.round(poseSessions.reduce((sum, s) => sum + s.accuracy, 0) / poseSessions.length) : 0;
    return { pose: label.split(' ')[0], accuracy: avg, fullMark: 100 };
  });

  // --- Bar Chart Data: how many times each pose was practiced ---
  const barData = Object.entries(ASANA_NAMES).map(([id, label]) => ({
    name: label.split(' ')[0],
    count: sessions.filter(s => s.asana === id).length
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

  // --- Donut Chart Data: % of total time spent on each pose ---
  const timeByPose = {};
  sessions.forEach(s => { timeByPose[s.asana] = (timeByPose[s.asana] || 0) + s.duration; });
  const donutData = Object.entries(timeByPose).map(([id, dur]) => ({
    name: ASANA_NAMES[id] || id, value: Math.round(dur)
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.06) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <div className="container animate-fade-in">
      {/* Header */}
      <header className="responsive-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="gradient-text">{user?.displayName ? `${user.displayName.split(' ')[0]}'s` : 'Your'} Progress</h1>
          <p className="subtitle" style={{ color: 'var(--text-muted)' }}>
            {user?.email} &nbsp;|&nbsp; {sessions.length} Real Sessions Completed
          </p>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading your session data from Firebase...</p>
        </div>
      ) : (
      <>
      {/* Stat Cards */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Accuracy</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{avgAccuracy}%</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Time</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{totalTimeStr}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Best Pose</h3>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)', marginTop: '15px' }}>
            {(ASANA_NAMES[bestPose] || bestPose).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Row 1: Area Chart + AI Insights */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>📈 Weekly Performance</h2>
          {sessions.length === 0 ? <EmptyState message="No data yet. Practice a pose in the Yoga Session page to populate this chart!" /> : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExertion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tickMargin={10} />
                  <YAxis stroke="var(--text-muted)" tickMargin={10} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ paddingTop: '15px' }} />
                  <Area type="monotone" dataKey="accuracy" name="AI Accuracy (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorAccuracy)" strokeWidth={3} />
                  <Area type="monotone" dataKey="exertion" name="Exertion" stroke="#6366f1" fillOpacity={1} fill="url(#colorExertion)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>💡 AI Insights</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid #10b981', borderRadius: '8px' }}>
              <h4 style={{ color: '#10b981', marginBottom: '5px', fontSize: '0.9rem' }}>🏆 Strongest Asana</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-main)' }}>Your best is <strong>{(ASANA_NAMES[bestPose] || bestPose)}</strong>. Keep it up!</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', borderRadius: '8px' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '5px', fontSize: '0.9rem' }}>⚠️ Tip</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-main)' }}>Practice each pose for at least 30 seconds for meaningful accuracy readings.</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '8px' }}>
              <h4 style={{ color: '#3b82f6', marginBottom: '5px', fontSize: '0.9rem' }}>⚡ Sessions</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-main)' }}>You have completed <strong>{sessions.length}</strong> real-time AI-tracked sessions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Radar + Bar Charts */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Radar Chart */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>🕸️ Pose Accuracy Radar</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Your average accuracy across all 12 poses</p>
          {sessions.length === 0 ? <EmptyState message="Practice poses to see your radar chart!" /> : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="pose" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.2)" />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />
                  <Tooltip {...tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart - Practice Frequency */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>📊 Practice Frequency</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>How many times you practiced each pose</p>
          {barData.length === 0 ? <EmptyState message="Practice different poses to see your frequency chart!" /> : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} sessions`, 'Count']} />
                  <Bar dataKey="count" name="Sessions" radius={[0, 4, 4, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Donut Chart */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>🍩 Time Distribution by Pose</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>What percentage of your total practice time is spent on each asana</p>
          {donutData.length === 0 ? <EmptyState message="Practice poses to see how you distribute your time!" /> : (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              <div style={{ height: '300px', width: '300px', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel}
                      outerRadius={130} innerRadius={65} dataKey="value">
                      {donutData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v}s`, 'Time']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {donutData.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: PIE_COLORS[index % PIE_COLORS.length], flexShrink: 0 }}></span>
                    <span>{entry.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', paddingLeft: '10px' }}>{entry.value}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      </>
      )}
    </div>
  );
};

export default ProgressTracking;
