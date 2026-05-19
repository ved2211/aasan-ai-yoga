// Calculate the angle between three points (A, B, C) where B is the vertex
export const calculateAngle = (a, b, c) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};

// Calculate 2D Euclidean distance
const getDistance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

// Analyze the pose based on the selected asana and MediaPipe landmarks
export const analyzePose = (landmarks, asanaId) => {
  if (!landmarks || landmarks.length === 0) {
    return { accuracy: 0, feedback: "No person detected in frame." };
  }

  const l = {
    nose: landmarks[0],
    leftShoulder: landmarks[11], rightShoulder: landmarks[12],
    leftElbow: landmarks[13], rightElbow: landmarks[14],
    leftWrist: landmarks[15], rightWrist: landmarks[16],
    leftHip: landmarks[23], rightHip: landmarks[24],
    leftKnee: landmarks[25], rightKnee: landmarks[26],
    leftAnkle: landmarks[27], rightAnkle: landmarks[28]
  };

  let accuracy = 0;
  let feedback = "Hold the pose steadily.";

  // Pre-calculate common angles and values
  const leftBodyAngle = calculateAngle(l.leftShoulder, l.leftHip, l.leftAnkle);
  const rightBodyAngle = calculateAngle(l.rightShoulder, l.rightHip, l.rightAnkle);
  const avgBodyAngle = (leftBodyAngle + rightBodyAngle) / 2;
  
  const leftKneeAngle = calculateAngle(l.leftHip, l.leftKnee, l.leftAnkle);
  const rightKneeAngle = calculateAngle(l.rightHip, l.rightKnee, l.rightAnkle);
  
  const armsAngle = calculateAngle(l.leftWrist, l.leftShoulder, l.rightShoulder);
  const wristDistance = getDistance(l.leftWrist, l.rightWrist);
  const isLyingDown = Math.abs(l.nose.y - l.leftAnkle.y) < 0.3; // Very small vertical height

  switch (asanaId) {
    case 'tadasana': { // 1. Mountain Pose
      if (avgBodyAngle > 170) {
        accuracy = 95; feedback = "Perfect alignment! Your spine is perfectly straight.";
      } else if (avgBodyAngle > 150) {
        accuracy = 75; feedback = "Stand up a bit straighter. Align your shoulders over your hips.";
      } else {
        accuracy = 40; feedback = "Your body is bent. Please stand completely straight with feet together.";
      }
      break;
    }
    case 'vrikshasana': { // 2. Tree Pose
      const isLeftBent = leftKneeAngle < rightKneeAngle;
      const bentAngle = isLeftBent ? leftKneeAngle : rightKneeAngle;
      const straightAngle = isLeftBent ? rightKneeAngle : leftKneeAngle;

      if (straightAngle < 160) {
        accuracy = 45; feedback = "Keep your standing leg completely straight for balance.";
      } else if (bentAngle < 60) {
        accuracy = 92; feedback = "Excellent! Ensure your bent foot rests on the inner thigh, not the knee joint.";
      } else if (bentAngle < 120) {
        accuracy = 75; feedback = "Raise your bent leg higher up your thigh if possible.";
      } else {
        accuracy = 30; feedback = "Bend one knee and place the sole of your foot on your opposite inner thigh.";
      }
      break;
    }
    case 'bhujangasana': { // 3. Cobra Pose
      const backArch = calculateAngle(l.leftShoulder, l.leftHip, l.leftKnee);
      if (!isLyingDown && l.leftShoulder.y < l.leftHip.y) {
        if (backArch > 110 && backArch < 160) {
          accuracy = 90; feedback = "Nice arch. Keep your elbows slightly bent and shoulders away from ears.";
        } else {
          accuracy = 65; feedback = "Lift your chest off the floor while keeping your pelvis grounded.";
        }
      } else {
        accuracy = 20; feedback = "Lie on your stomach and lift your chest using your back muscles.";
      }
      break;
    }
    case 'trikonasana': { // 4. Triangle Pose
      const legSpread = getDistance(l.leftAnkle, l.rightAnkle);
      if (legSpread > 0.3) {
        if (armsAngle > 150) {
          accuracy = 90; feedback = "Great arm extension and leg spread. Keep your chest open.";
        } else {
          accuracy = 70; feedback = "Extend your arms fully to create a straight line across your chest.";
        }
      } else {
        accuracy = 40; feedback = "Spread your legs wider apart.";
      }
      break;
    }
    case 'padmasana': { // 5. Lotus Pose
      if (leftKneeAngle < 45 && rightKneeAngle < 45) {
        accuracy = 95; feedback = "Excellent Lotus posture. Keep your spine completely straight and breathe.";
      } else if (leftKneeAngle < 90 && rightKneeAngle < 90) {
        accuracy = 75; feedback = "Cross your legs tightly, bringing your feet onto your opposite thighs if possible.";
      } else {
        accuracy = 30; feedback = "Sit down and cross your legs into the Lotus position.";
      }
      break;
    }
    case 'vajrasana': { // 6. Thunderbolt Pose
      if (leftKneeAngle < 45 && rightKneeAngle < 45 && avgBodyAngle > 80 && avgBodyAngle < 110) {
        accuracy = 90; feedback = "Perfect Thunderbolt pose. Keep your spine straight and hands on your knees.";
      } else if (leftKneeAngle < 60 && rightKneeAngle < 60) {
        accuracy = 70; feedback = "Sit back further onto your heels.";
      } else {
        accuracy = 40; feedback = "Kneel down and sit back entirely on your heels.";
      }
      break;
    }
    case 'adho_mukha_svanasana': { // 7. Downward Dog
      const hipAngle = calculateAngle(l.leftShoulder, l.leftHip, l.leftAnkle);
      if (hipAngle > 50 && hipAngle < 100) {
        accuracy = 90; feedback = "Good V-shape. Try to press your heels closer to the mat and straighten your arms.";
      } else if (hipAngle >= 100 && hipAngle < 140) {
        accuracy = 65; feedback = "Push your hips higher up and back to form a sharper inverted V.";
      } else {
        accuracy = 30; feedback = "Place hands and feet on the floor and lift hips high into an inverted V.";
      }
      break;
    }
    case 'paschimottanasana': { // 8. Seated Forward Bend
      if (leftKneeAngle > 160 && rightKneeAngle > 160) {
        if (avgBodyAngle < 50) {
          accuracy = 95; feedback = "Excellent flexibility! Try to touch your chest to your knees.";
        } else if (avgBodyAngle < 90) {
          accuracy = 70; feedback = "Keep your legs straight and bend further forward from your hips.";
        } else {
          accuracy = 40; feedback = "Sit with legs straight out and reach for your toes.";
        }
      } else {
        accuracy = 30; feedback = "Your knees are bent. Keep your legs completely straight on the ground.";
      }
      break;
    }
    case 'setu_bandhasana': { // 9. Bridge Pose
      const hipArch = calculateAngle(l.leftShoulder, l.leftHip, l.leftKnee);
      if (leftKneeAngle > 60 && leftKneeAngle < 120) {
        if (hipArch > 150) {
          accuracy = 92; feedback = "Great lift! Squeeze your glutes and keep your chest lifted.";
        } else {
          accuracy = 65; feedback = "Lift your hips much higher towards the ceiling.";
        }
      } else {
        accuracy = 35; feedback = "Lie on your back, bend your knees, plant your feet, and lift your hips.";
      }
      break;
    }
    case 'shavasana': { // 10. Corpse Pose
      if (isLyingDown && avgBodyAngle > 160) {
        accuracy = 98; feedback = "Complete relaxation. Close your eyes and breathe deeply.";
      } else {
        accuracy = 40; feedback = "Lie completely flat on your back with arms and legs relaxed.";
      }
      break;
    }
    case 'surya_namaskar': { // 11. Sun Salutation (Pranamasana - Prayer Pose)
      if (avgBodyAngle > 160) {
        if (wristDistance < 0.1) {
          accuracy = 95; feedback = "Perfect prayer posture. Prepare for the next step of the sequence.";
        } else {
          accuracy = 70; feedback = "Bring your palms completely together at the center of your chest.";
        }
      } else {
        accuracy = 50; feedback = "Stand completely straight before bringing hands into prayer.";
      }
      break;
    }
    case 'naukasana': { // 12. Boat Pose
      if (leftKneeAngle > 140 && rightKneeAngle > 140) {
        if (avgBodyAngle > 45 && avgBodyAngle < 110) {
          accuracy = 90; feedback = "Great core strength. Keep your chest lifted and legs straight.";
        } else {
          accuracy = 65; feedback = "Lean your torso back slightly and lift your legs higher to form a V shape.";
        }
      } else {
        accuracy = 40; feedback = "Straighten your legs completely and lift them off the floor while balancing on your sit bones.";
      }
      break;
    }
    default: {
      accuracy = 50; feedback = "Pose not recognized.";
      break;
    }
  }

  // Add slight random fluctuation for UI realism (±1%) if accuracy is not 0
  if (accuracy > 0) {
    accuracy = Math.min(100, Math.max(0, accuracy + Math.floor(Math.random() * 3 - 1)));
  }

  return { accuracy, feedback };
};
