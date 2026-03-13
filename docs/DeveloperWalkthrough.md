# Walkthrough - Course Payments, Redirection & Exam Stability

Transformed the DAKPlus monetization and exam experience with course-specific pricing, professional redirection, and mission-critical exam guards.

## Key Improvements

### 1. Course-Specific Pricing & Payments
The payment gateway now supports tiered pricing for different course batches:
- **MTS Exam**: ₹10
- **Postman / Mail Guard**: ₹30
- **PA / SA Exam**: ₹30
- **Combined Course**: ₹70
- **Individual Tests**: Stay at ₹49

### 2. Perfect Mobile Redirection
Resolved the critical issue where mobile payments wouldn't return to the app.
- Implemented **Deep Linking** using the `dakplus://` scheme.
- The Web Payment Page now automatically triggers the app return after successful verification.
- Integrated `NavigationContainer` linking to handle incoming deep links.

### 3. "My Purchases" Transaction History
Students can now track their financial history directly in the app.
- **New Screen**: `MyPurchasesScreen.js` displays a list of all successful transactions.
- **Side Menu Link**: Replaced generic "Transactions" with a dedicated "My Purchases" section.

### 4. Hardened Exam Environment
Addressed the request for a focused, distraction-free exam flow:
- **Exit Guards**: Added strict `BackHandler` and `useFocusEffect` guards in `TakeTestScreen.js`.
- **Accident Prevention**: Students must now confirm their intention to exit, with a warning that progress will be lost.
- **Focus Mode**: UI remains clean and focused on the question until the final "Finish" or "Submit" is pressed.

### 5. Robust AI Extraction
Fixed the "No document found" error for mobile uploads and lifted extraction limits:
- **Content-Type Detection**: Backend now detects file types like PDF/DOCX even if the mobile URI lacks an extension.
- **Limit Lifted**: Increased the AI extraction target to **100 questions** per document to support bulk uploads.
- **Timeout Management**: Matched mobile timeouts (120s) with backend AI processing times.

## Changes at a Glance

### Backend
- [DocumentParsingService.java](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/backend/dakplus-api/src/main/java/com/mockanytime/dakplus/assessment/service/DocumentParsingService.java) - Content-type aware parsing.
- [QuestionExtractionService.java](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/backend/dakplus-api/src/main/java/com/mockanytime/dakplus/assessment/service/QuestionExtractionService.java) - Increased 100-question limit.

### Web (Frontend)
- [PaymentPage.jsx](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/frontend/src/pages/PaymentPage.jsx) - New 10/30/30/70 pricing & deep linking.

### Mobile
- [AppNavigator.js](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/mobile/src/navigation/AppNavigator.js) - Linking config.
- [DashboardScreen.js](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/mobile/src/screens/DashboardScreen.js) - Dynamic "Buy Now" banners.
- [TakeTestScreen.js](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/mobile/src/screens/TakeTestScreen.js) - Navigation guards & focus mode.
- [MyPurchasesScreen.js](file:///c:/Users/PathipatiKirankumar/personal/AI%20Learn/web-app/DAKPlus/Git-Folders/Version-3/DAKPlus-Monolith/mobile/src/screens/MyPurchasesScreen.js) - [NEW] Transaction history.

## Verification Tips
1.  **Redirection**: Perform a test payment on mobile; it should return to the app and refresh your status.
2.  **Exam Guard**: Try to press the back button during a test.
3.  **Transactions**: Check your history in the side menu.
4.  **AI Extraction**: Bulk upload a 100-question PDF from mobile.
