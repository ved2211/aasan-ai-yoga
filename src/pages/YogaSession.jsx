import React, { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { useSmartMat } from '../hooks/useSmartMat';
import { analyzePose } from '../utils/poseMath';
import { saveSessionData } from '../utils/userData';
import { toast } from 'react-hot-toast';
import { CheckCircle2, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import './YogaSession.css';

const asanas = [
  { id: 'tadasana', name: 'Tadasana', english: 'Mountain Pose', description: 'Improves posture and balance.', imgUrl: '/tadasana.png', videoUrl: 'https://www.youtube.com/embed/gXkqTiW9LCw' },
  { id: 'vrikshasana', name: 'Vrikshasana', english: 'Tree Pose', description: 'Increases concentration and leg strength.', imgUrl: '/vrikshasana.png', videoUrl: 'https://www.youtube.com/embed/xWGT54sGSLc' },
  { id: 'bhujangasana', name: 'Bhujangasana', english: 'Cobra Pose', description: 'Strengthens the back and improves flexibility.', imgUrl: '/bhujangasana.png', videoUrl: 'https://www.youtube.com/embed/n6jrC6WeF84' },
  { id: 'trikonasana', name: 'Trikonasana', english: 'Triangle Pose', description: 'Stretches the body and improves digestion.', imgUrl: '/trikonasana.png', videoUrl: 'https://www.youtube.com/embed/upFYlxZHif0' },
  { id: 'padmasana', name: 'Padmasana', english: 'Lotus Pose', description: 'Helps in meditation and calming the mind.', imgUrl: '/padmasana.png', videoUrl: 'https://www.youtube.com/embed/kYV30Rz349c' },
  { id: 'vajrasana', name: 'Vajrasana', english: 'Thunderbolt Pose', description: 'Good for digestion after meals.', imgUrl: '/vajrasana.png', videoUrl: 'https://www.youtube.com/embed/8IeA4lgLT5U' },
  { id: 'adho_mukha_svanasana', name: 'Adho Mukha Svanasana', english: 'Downward Dog', description: 'Strengthens arms and legs.', imgUrl: '/adho_mukha_svanasana.png', videoUrl: 'https://www.youtube.com/embed/WfgWFTpPnlU' },
  { id: 'paschimottanasana', name: 'Paschimottanasana', english: 'Seated Forward Bend', description: 'Reduces stress and stretches the spine.', imgUrl: '/paschimottanasana.png', videoUrl: 'https://www.youtube.com/embed/l4ltpa05qls' },
  { id: 'setu_bandhasana', name: 'Setu Bandhasana', english: 'Bridge Pose', description: 'Strengthens the back and chest.', imgUrl: '/setu_bandhasana.png', videoUrl: 'https://www.youtube.com/embed/H4L0B9Z-o0Y' },
  { id: 'shavasana', name: 'Shavasana', english: 'Corpse Pose', description: 'Provides complete relaxation.', imgUrl: '/shavasana.png', videoUrl: 'https://www.youtube.com/embed/MfYRSxAVBx4' },
  { id: 'surya_namaskar', name: 'Surya Namaskar', english: 'Sun Salutation', description: 'Full body exercise with multiple poses.', imgUrl: '/surya_namaskar.png', videoUrl: 'https://www.youtube.com/embed/7uV87K3yGjU' },
  { id: 'naukasana', name: 'Naukasana', english: 'Boat Pose', description: 'Strengthens abdominal muscles.', imgUrl: '/naukasana.png', videoUrl: 'https://www.youtube.com/embed/spx5jVgWH2E' }
];

const YogaSession = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [feedback, setFeedback] = useState("Initializing AI Camera...");
  const [poseAccuracy, setPoseAccuracy] = useState(0);
  const [selectedAsana, setSelectedAsana] = useState('Tadasana');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  const { isConnected, pressureData, sweatLevel, connectMat, disconnectMat, simulateConnection, error } = useSmartMat();

  const currentAsanaDetails = asanas.find(a => a.name === selectedAsana) || asanas[0];
  
  // Tracking actual user performance
  const selectedAsanaRef = useRef(currentAsanaDetails.id);
  const sessionStartTimeRef = useRef(Date.now());
  const maxAccuracyRef = useRef(0);

  // Helper: save the current pose session if it has meaningful data
  const flushCurrentSession = () => {
    if (maxAccuracyRef.current > 0) {
      const durationSeconds = (Date.now() - sessionStartTimeRef.current) / 1000;
      if (durationSeconds > 3) {
        saveSessionData(selectedAsanaRef.current, maxAccuracyRef.current, Math.round(durationSeconds));
        toast.success(`Session saved: ${Math.round(durationSeconds)}s of ${selectedAsanaRef.current}`);
      }
    }
  };

  // When user switches asana: save the previous pose, reset counters
  useEffect(() => {
    flushCurrentSession();
    selectedAsanaRef.current = currentAsanaDetails.id;
    sessionStartTimeRef.current = Date.now();
    maxAccuracyRef.current = 0;
  }, [currentAsanaDetails]);

  // Auto-save every 10 seconds so navigating away doesn't lose data
  useEffect(() => {
    const interval = setInterval(() => {
      flushCurrentSession();
      // Reset start time so next interval doesn't double-count duration
      sessionStartTimeRef.current = Date.now();
      maxAccuracyRef.current = 0;
    }, 10000);

    // Also save when user leaves the page
    return () => {
      clearInterval(interval);
      flushCurrentSession();
    };
  }, []);

  useEffect(() => {
    let poseLandmarker;
    let requestAnimationFrameId;
    let lastVideoTime = -1;

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        setIsModelLoaded(true);
        setFeedback("AI Ready. Waiting for camera permissions...");
        startCamera();
      } catch (err) {
        console.error("Error loading MediaPipe:", err);
        setFeedback("Error loading AI. Please check your internet connection.");
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setFeedback("Camera access denied. Please allow camera permissions to use the Yoga Session.");
      }
    };

    const predictWebcam = async () => {
      if (!videoRef.current || !canvasRef.current || !poseLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext("2d");
      const drawingUtils = new DrawingUtils(canvasCtx);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const renderLoop = () => {
        let startTimeMs = performance.now();
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          
          const results = poseLandmarker.detectForVideo(video, startTimeMs);
          
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (results.landmarks && results.landmarks.length > 0) {
            // Analyze pose and update feedback (throttled to 500ms to avoid React render spam)
            if (!renderLoop.lastAnalysisTime || startTimeMs - renderLoop.lastAnalysisTime > 500) {
              const analysis = analyzePose(results.landmarks[0], selectedAsanaRef.current);
              setPoseAccuracy(analysis.accuracy);
              setFeedback(analysis.feedback);
              
              // Track their highest accuracy achieved in this session
              if (analysis.accuracy > maxAccuracyRef.current) {
                maxAccuracyRef.current = analysis.accuracy;
              }
              
              renderLoop.lastAnalysisTime = startTimeMs;
            }

            for (const landmark of results.landmarks) {
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
                color: 'rgba(59, 130, 246, 0.8)',
                lineWidth: 4
              });
              drawingUtils.drawLandmarks(landmark, {
                radius: 4,
                color: '#10b981',
                fillColor: '#ffffff',
                lineWidth: 2
              });
            }
          } else {
            setFeedback("Please step back and stand completely in the camera frame.");
          }
          canvasCtx.restore();
        }
        requestAnimationFrameId = window.requestAnimationFrame(renderLoop);
      };
      renderLoop();
    };

    initializeMediaPipe();

    return () => {
      if (requestAnimationFrameId) {
        window.cancelAnimationFrame(requestAnimationFrameId);
      }
      if (poseLandmarker) {
        poseLandmarker.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getPressureColor = (val) => {
    if (val < 50) return 'rgba(59, 130, 246, 0.3)';
    if (val < 150) return 'rgba(245, 158, 11, 0.6)';
    return 'rgba(239, 68, 68, 0.8)';
  };

  return (
    <>
    <ParticleBackground />
    <div className="container session-container animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
      <header className="session-header">
        <div className="header-left">
          <h1 className="gradient-text">Live Yoga Session</h1>
          <div className="asana-selector-wrapper">
            <select 
              value={selectedAsana} 
              onChange={(e) => setSelectedAsana(e.target.value)}
              className="asana-selector"
            >
              {asanas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{isConnected ? 'Smart Mat: Connected' : 'Smart Mat: Disconnected'}</span>
          {!isConnected && (
            <>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', marginLeft: '10px' }} onClick={connectMat}>
                Pair Mat
              </button>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', marginLeft: '5px' }} onClick={simulateConnection}>
                Simulate
              </button>
            </>
          )}
          {isConnected && (
             <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', marginLeft: '10px' }} onClick={disconnectMat}>
               Disconnect
             </button>
          )}
        </div>
      </header>

      <div className="session-layout">
        <div className="main-camera glass-panel">
          {!isModelLoaded && (
             <div className="loading-overlay">
               <div className="spinner"></div>
               <p>Loading AI Pose Models...</p>
             </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="video-feed"
          ></video>
          <canvas 
            ref={canvasRef} 
            className="pose-canvas"
          ></canvas>
        </div>

        <div className="sidebar">
          
          {/* Reference Image Panel */}
          <div className="reference-panel glass-panel">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Target Asana</h2>
            <div className="reference-image-container">
              <img src={currentAsanaDetails.imgUrl} alt={selectedAsana} className="reference-img" />
              <div className="reference-overlay">
                <h4>{currentAsanaDetails.english}</h4>
                <p style={{ marginBottom: currentAsanaDetails.videoUrl ? '10px' : '0' }}>{currentAsanaDetails.description}</p>
                {currentAsanaDetails.videoUrl && (
                  <button 
                    className="btn btn-secondary video-preview-btn" 
                    onClick={() => setIsVideoModalOpen(true)}
                  >
                    <Play size={14} fill="currentColor" /> View Tutorial Video
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="feedback-panel glass-panel">
            <h2 style={{ fontSize: '1.2rem' }}>AI Assistant</h2>
            <div className="ai-status-indicator">
              <span className="pulse-dot"></span>
              <p className="feedback-text">{feedback}</p>
            </div>
            
            <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Real-time Accuracy</h3>
            
            <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '10px', padding: '15px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>Score</span>
                <span style={{ fontWeight: '700', color: poseAccuracy > 80 ? 'var(--success)' : (poseAccuracy > 50 ? 'var(--warning)' : 'var(--danger)') }}>
                  {poseAccuracy}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${poseAccuracy}%`, 
                  height: '100%', 
                  background: poseAccuracy > 80 ? 'var(--success)' : (poseAccuracy > 50 ? 'var(--warning)' : 'var(--danger)'),
                  transition: 'width 0.3s ease, background 0.3s ease'
                }}></div>
              </div>
            </div>

            <div className={`feedback-item ${poseAccuracy > 80 ? 'success' : 'warning'}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                {poseAccuracy > 80 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              </span>
              <p>{feedback}</p>
            </div>

            {poseAccuracy > 0 && poseAccuracy < 65 && (
              <div className="accuracy-alert-card animate-pulse-border" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="alert-bulb" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--danger)' }}>
                  <HelpCircle size={18} />
                </span>
                <div className="alert-content">
                  <p>Alignment adjustment recommended. Review the pose guide to improve form.</p>
                  <button 
                    className="btn btn-primary alert-action-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setIsVideoModalOpen(true)}
                  >
                    <Play size={12} fill="currentColor" /> Watch Tutorial Video
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mat-visualization glass-panel">
            <h2 style={{ fontSize: '1.2rem' }}>Smart Mat Pressure</h2>
            {error && <p style={{color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '10px'}}>{error}</p>}
            <div className="mat-grid">
              <div className="mat-cell" style={{ background: getPressureColor(pressureData[0]) }}></div>
              <div className="mat-cell" style={{ background: getPressureColor(pressureData[1]) }}></div>
              <div className="mat-cell" style={{ background: getPressureColor(pressureData[2]) }}></div>
              <div className="mat-cell" style={{ background: getPressureColor(pressureData[3]) }}></div>
            </div>
            <div className="mat-stats">
              <p>Sweat Level: <span style={{ color: sweatLevel === 'High' ? 'var(--warning)' : 'var(--text-main)' }}>{sweatLevel}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Glassmorphic Video Lightbox */}
      {isVideoModalOpen && currentAsanaDetails.videoUrl && (
        <div className="video-modal-overlay" onClick={() => setIsVideoModalOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setIsVideoModalOpen(false)}>×</button>
            <h3 className="video-modal-title">{selectedAsana} ({currentAsanaDetails.english}) Tutorial</h3>
            <div className="video-iframe-container">
              <iframe
                src={`${currentAsanaDetails.videoUrl}?autoplay=1&rel=0`}
                title={`${selectedAsana} Tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="video-modal-tips">
              <strong>Posture Alignment Tip:</strong> Focus on breathing slowly, keeping your core engaged, and aligning your joints according to the visual guides. Adjust your position dynamically to see your score rise!
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default YogaSession;
