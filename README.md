# BunkSafe v1.0.0 🛡️

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Privacy](https://img.shields.io/badge/data-local%20only-success?style=flat-square)
![Built With](https://img.shields.io/badge/built%20with-Expo%20%2B%20React%20Native-blueviolet?style=flat-square)

> **Note:** This app is built specifically for **NIE (National Institute of Engineering)** students. It connects exclusively to the `parents.nie.ac.in` student portal.

Bunk Safe is a fully private, locally-run React Native mobile application for students to track their Continuous Internal Evaluation (CIE) marks and attendance without compromising their credentials or data.

## Features ✨

- **100% Private:** Your student credentials (USN & DOB) and academic records never leave your device. All data is stored locally using `AsyncStorage`.
- **Automated Background Sync:** Uses a headless WebView to authenticate and extract the latest CIE and Attendance records directly from the student portal.
- **Attendance Tracker:** Visualizes subject attendance with color-coded indicators, a live overall average summary, and a "bunks remaining" counter per subject.
- **CIE Dashboard:** Dynamically extracts and presents T1, T2, Q1, Q2, IL1, IL2, and Total CIE marks with color-coded bar charts.
- **Pull-to-Refresh:** Swipe down on any tab to trigger a fresh sync from the portal.
- **Sleek Onboarding:** A smooth, paginated onboarding experience highlighting the privacy-first approach.
- **Offline First:** Once synced, you can view your dashboard fully offline.
- **Auto Update Alerts:** Notifies you on startup when a new version is available on GitHub Releases.

## Screenshots 📱

> *(Screenshots coming soon)*

## Tech Stack 🛠️

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Language | TypeScript |
| Scraping | `react-native-webview` (Injected JS) |
| Animations | `react-native-reanimated` |
| Storage | `@react-native-async-storage/async-storage` |
| UI | `expo-linear-gradient`, `@expo/vector-icons` |

## How It Works ⚙️

1. **Onboarding:** First-time users are introduced to the app features through a sliding carousel, then enter their USN and DOB.
2. **Local Storage Setup:** Credentials are saved strictly on device storage and never transmitted externally.
3. **Automated Scraping:** When the user taps the refresh icon (or pulls down to refresh):
   - A hidden `WebView` instance navigates to the portal.
   - Using injected JavaScript, it automates filling the login form.
   - It navigates to the dashboard, collects subject detail links, and iterates through each page to extract HTML structures.
   - `AmCharts` JSON metadata in the source is intercepted directly to retrieve precise assessment values.
4. **Dashboard Render:** The native UI instantly reflects the updated, locally saved JSON data.

## Attendance Logic 📊

- Attendance below **75%** is flagged as ⚠️ **At Risk**.
- Each card shows how many classes you can still bunk safely (or how many you need to attend to recover).
- The top **summary card** shows your overall average and a count of at-risk subjects at a glance.

## Installation 🚀

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kaushal-Prakash/bunk-safe
   cd bunk-safe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo server:**
   ```bash
   npx expo start
   ```

4. **Run on device/emulator:**
   - Scan the QR code with the Expo Go app on your phone.
   - Or press `a` to run on Android / `i` to run on iOS simulators.

## Security & Privacy 🔒

This app is built precisely because many wrapper apps exist that send user credentials to centralized backend servers. With Bunk Safe:
- There is **no backend server**.
- The scraping code runs directly on the client via `react-native-webview`.
- It connects exclusively to the official parent/student portal over HTTPS.

## Roadmap 🗓️

- [x] Attendance tracker with progress bars
- [x] CIE marks dashboard with bar charts
- [x] Pull-to-refresh on all tabs
- [x] Bunks remaining counter
- [x] Overall attendance summary card
- [ ] Automatic update notifications via GitHub Releases
- [ ] Bunk calculator tool (reverse engineer: "how many can I miss?")
- [ ] Biometric / PIN app lock
- [ ] Android home screen widget

## Contributing 🤝

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License 📜

Distributed under the MIT License.
