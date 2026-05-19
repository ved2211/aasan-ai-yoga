import React, { useState, useEffect } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over a clickable element
      const target = e.target;
      const isClickable = 
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button');
        
      setIsPointer(!!isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Don't render on mobile devices (touch screens)
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      {/* Tiny solid dot that exactly tracks the mouse */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) scale(${isPointer ? 0.5 : 1})`,
          width: '8px',
          height: '8px',
          backgroundColor: 'var(--primary)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      />
      
      {/* Larger glowing ring that trails slightly behind */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
          width: '32px',
          height: '32px',
          border: '1.5px solid var(--primary)',
          backgroundColor: isPointer ? 'rgba(212, 255, 79, 0.1)' : 'transparent',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
          // The delay on transform creates the smooth trailing effect
          transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease',
          opacity: 0.6
        }}
      />
    </>
  );
};

export default CustomCursor;
