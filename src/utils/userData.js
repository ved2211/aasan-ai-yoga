import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

// ─── FIRESTORE: Save a completed yoga session ────────────────────────────────
export const saveSessionData = async (asanaId, accuracy, durationSeconds) => {
  if (!auth.currentUser) return;

  try {
    await addDoc(collection(db, 'sessions'), {
      uid: auth.currentUser.uid,
      asana: asanaId,
      accuracy: Math.round(accuracy),
      duration: Math.round(durationSeconds),
      date: new Date().toISOString(),
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error saving session to Firestore:', err);
  }
};

// ─── FIRESTORE: Real-time listener for the current user's sessions ─────────────
// Returns an unsubscribe function. Call it on unmount to stop listening.
export const subscribeToUserSessions = (callback) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  // Simple query with only a single filter - no composite index needed!
  const q = query(
    collection(db, 'sessions'),
    where('uid', '==', auth.currentUser.uid)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Sort by timestamp client-side (no Firestore index needed)
    const data = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => b.timestamp - a.timestamp);
    callback(data);
  }, (err) => {
    console.error('Firestore listener error:', err);
    callback([]);
  });

  return unsubscribe;
};

// ─── Generate chart data grouped by day of the week ──────────────────────────
export const generateChartData = (sessions) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekData = days.map(day => ({ name: day, accuracy: 0, count: 0, duration: 0 }));

  sessions.forEach(session => {
    const date = new Date(session.date);
    const dayName = days[date.getDay()];
    const dayObj = weekData.find(d => d.name === dayName);
    if (dayObj) {
      dayObj.accuracy += session.accuracy;
      dayObj.duration += session.duration;
      dayObj.count += 1;
    }
  });

  return weekData.map(d => ({
    name: d.name,
    accuracy: d.count > 0 ? Math.round(d.accuracy / d.count) : 0,
    duration: d.duration,
    exertion: d.count > 0 ? Math.min(100, 30 + (d.duration / 60) * 5) : 0
  }));
};
