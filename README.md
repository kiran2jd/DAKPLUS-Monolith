# DAK Plus - Elite Preparation for Indian Postal Exams

DAK Plus is a comprehensive, AI-powered preparation platform designed to help aspirants ace Indian Postal Department examinations (MTS, Postman/Mail Guard, and PA/SA). The platform combines a high-performance Spring Boot backend with a React web management dashboard and a highly optimized React Native mobile application.

---

## 🏗️ Platform Modules

The project is structured as a monolith repository divided into three specialized components:

### ⚙️ [Backend API](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/backend/dakplus-api) (The "Brain")
Built using **Spring Boot 3.2** and **MongoDB Atlas**.
- **Role**: Manages core business logic, user profiles, payments verification, and OTP generation.
- **Key Services**: Integrates Msg91/Twilio SMS gateways, Razorpay API, and AI processing clients.

### 💻 [Frontend Dashboard](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/frontend) (The "Admin Center")
Built using **React 18**, **Vite**, and **Tailwind CSS**.
- **Role**: Admin console for content creators and teachers to manage courses, topics, and upload test papers.
- **Redirection**: Serves as the landing page and the secure payment checkout page for mobile clients.

### 📱 [Mobile Client](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/mobile) (The "Student Hub")
Built using **React Native** (on **Expo SDK 52** for maximum device compatibility and crash-free launches).
- **Role**: The main interface for students.
- **Features**: Interactive bilingual mock tests, performance analytics graphs, syllabus materials reader, and order histories.

---

## 🚀 Key Modern Features & Flows

### 🔑 passwordless OTP Sign-In
Provides fast, passwordless registration and login. Optimized with **Msg91** and **Twilio** API routing to guarantee delivery of 6-digit codes across all Indian telecom circles.

### 💰 Tiered Course Batches & Pricing
Content and test papers are segmented into distinct course packages:
- **MTS Exam**: ₹399 (Target 2026 Batch)
- **Postman & Mail Guard (PMMG)**: ₹599 (Papers 1 & 2)
- **PA/SA Exam**: ₹799 (Advanced Preparation)
- **Combined Pro Course**: ₹999 (Global unlock for all courses)

### 🔒 Content Security & Gating
- **Mock Test Free Trials**: The oldest two tests in every course are automatically unlocked as `FREE SAMPLE` trials. All subsequent tests are designated as `[PRO]` and require course ownership.
- **Syllabus PDF Gating**: Study files and subtopic manuals are gated. Non-paying users are prompted to unlock via a direct payment redirect.
- **Copy Protection**: Fully integrates `expo-screen-capture` on mobile. Globally blocks system screenshots, screen recordings, and multitasking preview captures to safeguard premium study assets.

### 💳 Web-to-Mobile Payment Redirection
Students tap to purchase a course in the mobile app, completing checkouts securely on the web payment gateway via Razorpay. Upon successful verification, the app is opened via deep linking (`dakplus://`), optimistically syncing local storage properties to immediately unlock content.

### 🔍 Search Highlighting & Question Accordions
Both web and mobile interfaces feature interactive search highlighting (using regex matching). Searching for terms displays matching mock tests alongside a collapsible **Matching Questions** panel displaying exact questions, option matches, and explanations with highlighted terms.

### 🧠 Groq-Powered AI Question Parser
Instructors can upload PDFs, DOCX, or TXT documents. The system parses them (handling up to 100 questions per batch) and auto-generates bilingual (English/Hindi) question banks. It uses **Groq API** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) with automatic fallback to **Google Gemini** (`gemini-2.5-flash`) on API rate limit timeouts.

### ✍️ Distraction-Free Exam Environment
- **Focus Mode**: Hides drawer navigations, status bars, and headers during a test.
- **Exit Guards**: Intercepts hardware and UI back gestures, prompting students to confirm exit before discarding progress.
- **Submit Safeguard**: Warns students if they attempt to submit their exam with unanswered questions.

---

## 📦 Production Builds & Links

Both Android build outputs have been successfully generated and compiled using Expo Application Services (EAS) on Expo SDK 52:

- **Testing APK (Preview Profile)**:
  - **Purpose**: Internal testing on Android devices.
  - **Download Link**: [Download Testing APK](https://expo.dev/artifacts/eas/dN87Qjkh2uu_KE9jp0tA2Y5UOXnbL_KQ_VqinZFNg3M.apk)
- **Production AAB (Production Profile)**:
  - **Purpose**: Upload directly to the Google Play Store Console (Target Package: `com.kiran2jd.dakplus`).
  - **Download Link**: [Download Production AAB](https://expo.dev/artifacts/eas/3Ess3-0N7kNBlpTWEOonfnvh9QEhQlXO-m41IjQn4cs.aab)
  - **Version Code**: `6`

---

## 📖 Complete Documentation Reference

👉 **[Comprehensive Features and Operational Flows Guide](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/docs/FeaturesAndFlows.md)**

*Built with ❤️ for Indian Postal Service Aspirants.*
