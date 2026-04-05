# Mobile App Export Instructions (Android & iOS)

This application is built as a Progressive Web App (PWA) and can be easily converted to native Android and iOS apps using **Capacitor**.

## Prerequisites
- Node.js installed
- Android Studio (for Android)
- Xcode (for iOS, requires macOS)

## Steps to Generate Android/iOS Folders

1. **Install Capacitor Dependencies:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
   ```

2. **Initialize Capacitor:**
   ```bash
   npx cap init
   ```

3. **Build the Web Project:**
   ```bash
   npm run build
   ```

4. **Add Platforms:**
   ```bash
   npx cap add android
   npx cap add ios
   ```

5. **Sync Files:**
   ```bash
   npx cap sync
   ```

6. **Open in IDEs:**
   - For Android: `npx cap open android` (Opens Android Studio)
   - For iOS: `npx cap open ios` (Opens Xcode)

## Flutter Alternative
If you prefer Flutter, you can use a `WebView` in a new Flutter project to wrap this web application URL:
1. Create a new Flutter project.
2. Add `webview_flutter` dependency.
3. Point the WebView to your hosted URL (e.g., your Netlify URL).

## WhatsApp Integration
The app now includes WhatsApp sharing for:
- **Billing:** Share invoices directly with patients.
- **Appointments:** Send reminders to patients.
