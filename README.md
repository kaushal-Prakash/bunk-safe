# BunkSafe 🛡️

Bunk Safe is a fully private, locally-run React Native mobile application for students to track their Continuous Internal Evaluation (CIE) marks and attendance without compromising their credentials or data.

## Features ✨

- **100% Private:** Your student credentials (USN & DOB) and academic records never leave your device. All data is stored locally using `AsyncStorage`.
- **Automated Background Sync:** Uses a headless WebView to authenticate and extract the latest CIE and Attendance records directly from the student portal.
- **Attendance Tracker:** Visualizes subject attendance with clean, color-coded indicators (Red for below 75% threshold, Green for safe).
- **CIE Dashboard:** Dynamically extracts and presents T1, T2, Q1, Q2, IL1, IL2, and Total CIE marks across all subjects.
- **Sleek Onboarding:** A smooth, paginated onboarding experience highlighting the privacy-first approach.
- **Offline First:** Once synced, you can view your dashboard fully offline.

## Tech Stack 🛠️

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Scraping:** `react-native-webview` (Injected JavaScript)
- **Animations:** `react-native-reanimated`
- **UI Components:** `expo-linear-gradient`, `@expo/vector-icons`

## How It Works ⚙️

1. **Onboarding:** First-time users are introduced to the app features through a sliding carousel, then enter their USN and DOB.
2. **Local Storage Setup:** These credentials are encrypted (or saved locally strictly on device storage) and linked to a local profile.
3. **Automated Scraping:** When the user taps the refresh icon:
   - A hidden `WebView` instance navigates to the portal.
   - Using injected JavaScript, it automates filling the login form.
   - It navigates to the dashboard, collects subject detail links, and iterates through each page to extract HTML structures.
   - `AmCharts` JSON metadata in the source is intercepted directly to retrieve precise assessment values.
4. **Dashboard Render:** The native UI instantly reflects the updated, locally saved JSON data.

## Installation 🚀

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd bunk-safe
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the Expo server:**
   \`\`\`bash
   npx expo start
   \`\`\`

4. **Run on device/emulator:**
   - Scan the QR code with the Expo Go app on your phone.
   - Or press \`a\` to run on Android / \`i\` to run on iOS simulators.

## Security & Privacy 🔒

This app is built precisely because many wrapper apps exist that send user credentials to centralized backend servers. With Bunk Safe:
- There is **no backend server**.
- The scraping code runs directly on the client via `react-native-webview`.
- It connects exclusively to the official parent/student portal over HTTPS.

## Contributing 🤝

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License 📜

Distributed under the MIT License. See \`LICENSE\` for more information.
