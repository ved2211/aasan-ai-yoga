# Aasan AI — Smart Yoga Trainer 🧘‍♂️
**Complete Project Documentation & Technical Architecture**

---

## 1. Project Overview
**Aasan AI** is a premium, AI-powered web application designed to act as a personal yoga trainer. It uses the device's webcam to track user movements in real-time, analyzes their pose accuracy using machine learning, and provides dynamic health and diet recommendations based on their actual physical exertion.

## 2. Technology Stack
* **Frontend Framework:** React.js (built with Vite for lightning-fast HMR and optimized production builds)
* **AI & Computer Vision:** TensorFlow.js and Google MediaPipe (`@mediapipe/tasks-vision`) for real-time skeletal tracking.
* **Backend & Database:** Firebase Authentication (Email/Google Auth) and Cloud Firestore (NoSQL real-time database).
* **Hosting:** Firebase Hosting.
* **Data Visualization:** Recharts (Radar, Bar, and Line charts).
* **UI / Aesthetics:** Native CSS3 with a "Premium Dark" design system (custom cubic-bezier animations, Native Canvas particles, Skeleton Loaders, and custom cursors).

---

## 3. Core Algorithms & Mathematical Calculations

### A. Pose Detection & Accuracy Calculation (`poseMath.js`)
The application does not just guess if a pose is correct; it calculates the exact joint angles mathematically.
1. **Landmark Extraction:** MediaPipe extracts 33 3D coordinates (x, y, z) of the human body at 30-60 frames per second.
2. **Angle Calculation:** We calculate the angles between three joints (e.g., Shoulder, Elbow, Wrist) using the **Law of Cosines** and vector dot products.
   * *Formula used:* `Angle = Math.acos( (a² + b² - c²) / (2ab) ) * (180/π)`
3. **Accuracy Scoring:** Each target pose (like Tadasana or Tree Pose) has predefined "ideal" angles. The AI compares the user's real-time angles against the ideal angles and outputs an accuracy percentage (0% to 100%).

### B. Dynamic Calorie & Diet Calculation
Instead of providing generic diet plans, the app calculates exact metabolic exertion based on *how hard* and *how long* the user practiced.

1. **Metabolic Equivalent (Burn Rate):**
   * If Accuracy < 50% (Gentle stretching): **3.5 calories / minute**
   * If Accuracy 50% - 80% (Moderate flow): **5.0 calories / minute**
   * If Accuracy > 80% (Vigorous practice): **7.0 calories / minute**
2. **Total Calories Burned:**
   * *Formula:* `Calories Burned = (Session Duration in Seconds / 60) × Burn Rate`
3. **Dietary Recommendation (Post-Workout Recovery):**
   * The app recommends a meal size to replenish energy without overeating.
   * *Formula:* `Recommended Meal Size (kcal) = 400 (Base calories) + (Calories Burned × 2)`

### C. Streak & Gamification Logic
To keep users motivated, the app calculates consecutive practice days.
1. **Streak Calculation:** The app fetches all session timestamps from Firestore, extracts unique calendar days, sorts them descending, and counts how many consecutive days touch `Today` or `Yesterday`.
2. **AI Recommendation (Weakest Pose):** The app aggregates all historical session data, calculates the average accuracy for every single pose, and recommends the pose with the **lowest average score** to help the user balance their skill tree.

---

## 4. UI/UX & Premium Design Engineering
The app was engineered to feel like a multi-million dollar fitness product (akin to Apple Fitness, Whoop, or Nike Training Club).

* **Premium Dark Mode:** Built on a true-black (`#0A0A0A`) background with "Electric Lime" (`#D4FF4F`) accents.
* **Split-Screen Authentication:** Desktop users see a beautiful 50/50 split with high-resolution photography and a sleek login form.
* **HTML5 Canvas Particles:** A highly performant, math-based particle system runs in the background. It draws nodes and connects them with lines based on proximity (`Math.sqrt(dx² + dy²)`), creating a glowing neural-network effect.
* **Micro-Interactions & Physics:**
  * **Hover Lift:** Cards elevate and project a lime glow using a custom `cubic-bezier(0.34, 1.56, 0.64, 1)` spring animation.
  * **Ripple & Squish:** Mobile taps trigger a ripple expansion calculated dynamically from the exact `(x, y)` coordinate of the user's finger, while the button physically scales down by 5% (`scale(0.95)`).
* **Skeleton Loaders:** Instead of spinners, data fetching triggers a shimmering UI skeleton to reduce perceived loading times.

---

## 5. Database Architecture (Firestore)
Data is structured to allow massive scaling without complex query indexes.

**Collection:** `users` / `sessions`
* **Schema:**
  ```json
  {
    "uid": "String (Firebase Auth ID)",
    "asana": "String (Pose Name)",
    "accuracy": "Number (0-100)",
    "duration": "Number (Seconds)",
    "date": "ISO 8601 Timestamp"
  }
  ```
* **Security Rules:** Firestore rules guarantee that `request.auth.uid == resource.data.uid`, ensuring users can only read and write their own encrypted fitness data.
