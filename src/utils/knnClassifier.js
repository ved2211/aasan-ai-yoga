// knnClassifier.js - Machine Learning K-Nearest Neighbors Pose Normalization and Distance

// 1. Find the center of the body (hips)
const getCenterPoint = (landmarks) => {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  return {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2
  };
};

// 2. Find the torso size (distance from hips to shoulders) to scale the body
const getPoseSize = (landmarks) => {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  
  const centerHip = { x: (leftHip.x + rightHip.x)/2, y: (leftHip.y + rightHip.y)/2 };
  const centerShoulder = { x: (leftShoulder.x + rightShoulder.x)/2, y: (leftShoulder.y + rightShoulder.y)/2 };
  
  const torsoSize = Math.sqrt(
    Math.pow(centerShoulder.x - centerHip.x, 2) + 
    Math.pow(centerShoulder.y - centerHip.y, 2)
  );
  
  // Prevent division by zero
  return torsoSize > 0.01 ? torsoSize : 0.01;
};

// 3. Normalize: Center at (0,0,0) and scale by torso size
// This ensures camera distance and person height do not affect the math!
export const normalizePose = (landmarks) => {
  if (!landmarks || landmarks.length < 33) return null;
  
  const center = getCenterPoint(landmarks);
  const size = getPoseSize(landmarks);
  
  return landmarks.map(lm => ({
    x: (lm.x - center.x) / size,
    y: (lm.y - center.y) / size,
    z: (lm.z - center.z) / size
  }));
};

// 4. Calculate Distance: Compare live normalized pose with target normalized pose
export const calculatePoseDistance = (normalizedLive, normalizedTarget) => {
  if (!normalizedLive || !normalizedTarget || normalizedTarget.length === 0) return Infinity;
  
  let totalDistance = 0;
  
  for (let i = 0; i < 33; i++) {
    const l1 = normalizedLive[i];
    const l2 = normalizedTarget[i];
    
    // 3D Euclidean distance for this specific joint
    const dist = Math.sqrt(
      Math.pow(l1.x - l2.x, 2) + 
      Math.pow(l1.y - l2.y, 2) + 
      Math.pow(l1.z - l2.z, 2) 
    );
    totalDistance += dist;
  }
  
  // Return the average distance per joint
  return totalDistance / 33;
};

// 5. Convert abstract distance into a human-readable 0-100% Accuracy Score
export const getAccuracyScore = (distance) => {
  // Calibration variable: A distance > 1.2 usually means totally different pose
  const MAX_ACCEPTABLE_DISTANCE = 1.2; 
  
  if (distance > MAX_ACCEPTABLE_DISTANCE) return 0;
  
  // Linearly scale from MAX down to 0 distance = 100% score
  const score = ((MAX_ACCEPTABLE_DISTANCE - distance) / MAX_ACCEPTABLE_DISTANCE) * 100;
  
  // Add an exponential curve so it's harder to get exactly 100% unless perfect
  return Math.round(Math.pow(score / 100, 1.5) * 100); 
};
