import React, { useState, useEffect } from 'react';

const SplashScreen = ({ userName }) => {
  const [phase, setPhase] = useState('enter'); // enter → show → exit

  useEffect(() => {
    // After showing for 1.8s, start the exit animation
    const showTimer = setTimeout(() => setPhase('exit'), 1800);
    return () => clearTimeout(showTimer);
  }, []);

  const firstName = userName ? userName.split(' ')[0] : 'Yogi';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '1.5rem',
        // Fade out the entire overlay
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
      }}
    >
      {/* Animated logo mark */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '18px',
          overflow: 'hidden',
          animation: 'splashScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <img src="/logo.png" alt="Aasan AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Welcome text */}
      <div
        style={{
          textAlign: 'center',
          animation: 'splashFadeUp 0.5s ease 0.2s both',
        }}
      >
        <p
          style={{
            fontSize: '0.8rem',
            color: '#525252',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontWeight: '500',
          }}
        >
          Welcome back
        </p>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: '800',
            letterSpacing: '-0.05em',
            color: '#FFFFFF',
            lineHeight: 1,
          }}
        >
          {firstName}
        </h1>
      </div>

      {/* Animated progress bar */}
      <div
        style={{
          width: '120px',
          height: '2px',
          background: '#1A1A1A',
          borderRadius: '1px',
          overflow: 'hidden',
          animation: 'splashFadeUp 0.5s ease 0.3s both',
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#D4FF4F',
            borderRadius: '1px',
            animation: 'progressFill 1.5s ease 0.4s forwards',
            width: '0%',
          }}
        />
      </div>

      <style>{`
        @keyframes splashScale {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
