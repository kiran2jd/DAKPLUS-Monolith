# DAK Plus - Elite Preparation for Indian Postal Exams

DAK Plus is a comprehensive, AI-powered platform designed to help aspirants ace Indian Postal Department exams (MTS, Postman/Mail Guard, and PA/SA). The project combines high-performance backend systems with modern web and mobile interfaces to provide a seamless learning experience.

---

## 🏗️ Project Architecture

Our project is a unified ecosystem divided into three specialized modules:

### ⚙️ [Backend](backend/dakplus-api) (The "Brain")
The backbone of the platform, built with **Spring Boot** and **MongoDB**.
- **Role**: Manages the database, business logic, and security.
- **Key Task**: It acts as the secure API gateway for both the web and mobile applications.

### 💻 [Frontend](frontend) (The "Admin Command Center")
A high-speed web dashboard built with **React** and **Vite**.
- **Role**: Designed for administrators and educators.
- **Key Task**: Used for content management, student tracking, and uploading complex test papers.

### 📱 [Mobile](mobile) (The "Student Hub")
A cross-platform mobile app built with **React Native (Expo)**.
- **Role**: The primary interface for students.
- **Key Task**: Taking interactive tests, reviewing results, reporting question issues, and managing subscriptions.

---

## 🚀 Key Modern Functionalities

### 🧠 **AI-Powered Question Extraction**  
*Located in: `QuestionExtractionService.java` (Backend)*  
Transform static documents (PDF, Word, TXT) into interactive mock tests instantly. Powered by **Groq / Llama-3**, the system sequentially processes large documents, handles OCR noise, and auto-generates bilingual (English/Hindi) question sets.

### 💳 **Secure Razorpay Payments**  
*Located in: `PaymentController.java` (Backend) & `PaymentScreen.js` (Mobile)*  
Integrates professional-grade payment processing. Students can securely subscribe to premium courses (MTS, PMMG, PASA) using UPI, Cards, or NetBanking with real-time transaction verification.

### 🔐 **Smart OTP Authentication**  
*Located in: `AuthService.java` (Backend) & `RegisterScreen.js` (Mobile)*  
Provides frictionless, password-less login. Optimized with **Msg91** and **Twilio**, ensuring high delivery rates for one-time passwords across India.

### 🚩 **Integrative Question Reporting**  
*Located in: `QuestionReportController.java` (Backend)*  
A direct feedback loop between the student and the admin. Students can flag incorrect options, typos, or translation errors directly from the test or result screen.

### 📊 **Performance & Analytics**  
*Located in: `ResultService.java` (Backend) & `AnalyticsScreen.js` (Mobile)*  
Sophisticated tracking that breaks down performance by topic, helping students identify their weak areas and focus their preparation effectively.

---

## 🛣️ Roadmap & Project Structure

- **`/backend`**: Houses the Java API. Configuration is managed in `application.yml`.
- **`/frontend`**: Houses the React web app. Optimized for desktop management.
- **`/mobile`**: Houses the Expo app. Built for stability across Android and iOS.
- **`/docs`**: Contains architectural diagrams and system documentation.

---

## 🛠️ Quick Tech Stack
- **Languages**: Java 17, JavaScript, HTML/CSS.
- **Frameworks**: Spring Boot 3.2, React 18, React Native (Expo).
- **Database**: MongoDB (Atlas).
- **Styling**: Tailwind CSS (Frontend), StyleSheet (Mobile).

---
*Built with ❤️ for Indian Postal Aspirants.*
