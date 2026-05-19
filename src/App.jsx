import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth } from './firebase';

import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';
import CustomCursor from './components/CustomCursor';
import Dashboard from './pages/Dashboard';
import YogaSession from './pages/YogaSession';
import DietRecommendations from './pages/DietRecommendations';
import ProgressTracking from './pages/ProgressTracking';
import Auth from './pages/Auth';
import './index.css';
import './mobile.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  // Track previous auth state so we only show splash on actual login
  const prevAuthRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // If user just logged IN (was null, now has a user) → show splash
      if (prevAuthRef.current === null && currentUser !== null) {
        setShowSplash(true);
        // Hide splash after animation completes (1.8s show + 0.6s fade = 2.4s)
        setTimeout(() => setShowSplash(false), 2500);
      }

      prevAuthRef.current = currentUser;
      setUser(currentUser);
      setLoading(false);
    });

    // Global Ripple Effect Listener for Buttons
    const createRipple = (e) => {
      const target = e.target.closest('.btn');
      if (!target) return;
      
      const circle = document.createElement('span');
      const diameter = Math.max(target.clientWidth, target.clientHeight);
      const radius = diameter / 2;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const rect = target.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${clientX - rect.left - radius}px`;
      circle.style.top = `${clientY - rect.top - radius}px`;
      circle.classList.add('ripple-span');

      const existing = target.getElementsByClassName('ripple-span')[0];
      if (existing) {
        existing.remove();
      }

      target.appendChild(circle);
      
      setTimeout(() => {
        circle.remove();
      }, 600);
    };

    document.addEventListener('mousedown', createRipple);
    document.addEventListener('touchstart', createRipple, { passive: true });

    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', createRipple);
      document.removeEventListener('touchstart', createRipple);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0A0A0A',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '1200px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text short"></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <CustomCursor />
      {/* Login-to-Dashboard splash animation */}
      {showSplash && <SplashScreen userName={user?.displayName} />}

      <div className="app-container">
        {user && <Navbar />}
        <main className={user ? 'page-content' : ''}>
          <Routes>
            {!user ? (
              <>
                <Route path="/login" element={<Auth />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            ) : (
              <>
                <Route path="/"         element={<Dashboard />} />
                <Route path="/session"  element={<YogaSession />} />
                <Route path="/diet"     element={<DietRecommendations />} />
                <Route path="/progress" element={<ProgressTracking />} />
                <Route path="*"         element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1F1F1F',
            color: '#fff',
            border: '1px solid #333',
            fontSize: '14px',
            borderRadius: '8px'
          },
          success: {
            iconTheme: { primary: '#D4FF4F', secondary: '#000' }
          }
        }}
      />
    </Router>
  );
}

export default App;
