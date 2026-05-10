# Changelog

## [2.0.2] - 2026-05-10

### 🆕 Portal Login Compatibility
* Added support for the new NIE portal verification step after DOB login.
* Scraper now auto-detects both login variants:
  * Username + DOB dropdown flow
  * Verification type + 4-digit value flow
* Added support for selecting **Father Mobile Last 4 Digits** and injecting/sending the 4-digit value reliably.

### ✅ Validation & UX
* Added pre-sync validation before scraping starts.
* Sync now fails fast with clear user-facing messages when required values are missing/invalid (USN, DOB format, father mobile last 4 digits).
* Updated onboarding and settings to collect/edit the father mobile last 4 digits used by the new portal flow.

### 🛠️ Stability Fixes
* Fixed hidden sync WebView state transition so scraping starts only after dashboard/login confirmation, preventing repeated "Not on dashboard page" retries.
* Hardened value injection for portal forms:
  * Native value setters
  * Explicit select option selection
  * Input/change/blur event dispatch
  * Form-level submit fallback
* Fixed top portal icon WebView injection by making logger bridge-safe when `window.ReactNativeWebView.postMessage` is unavailable.

## [2.0.1] - 2026-05-08

### 🐛 Bug Fixes
* **Improved Hardware Back Button Navigation:** Re-wrote the back button handling using React Native's `BackHandler`. 
   * Pressing the back button inside a specific subject's **Attendance History** now correctly routes you back to the main attendance list instead of closing the app.
   * Pressing back from the CIE or Settings tab will now route you to the Attendance tab.
   * Pressing back while the internal College Portal is open will attempt to go back on the web page, or gracefully close the portal overlay.
* **CIE Quiz Max Marks Fix:** Fixed a parsing bug where various naming conventions for quizzes (e.g., `Qz1`, `Qz2`, `Q1`, `Quiz 2`, `q1`) would display incorrect max marks. A new robust RegEx check now detects any quiz variation and properly enforces a maximum mark of `10`.

### 🛠️ Improvements & Maintenance
* **F-Droid Store Compliance:** Prepped the repository for publication on the F-Droid store. 
   * Added a standard Open-Source MIT License.
   * Generated the required `fastlane/metadata` directory structure complete with an F-Droid-optimized app description and summary.
   * Allowed the `android/` native build directory to be tracked by Git by running `npx expo prebuild` and tweaking the `.gitignore`, allowing F-Droid to build the app from source.
* **Asset Cleanup:** Reduced the project size slightly by removing unused default React Native and Expo fallback icons. Bound the splash screen configuration strictly to the custom `icon.png`.
