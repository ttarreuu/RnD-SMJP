# RnD-SMJP

**RnD-SMJP** is a React Native research and development project focused on implementing and testing mobile features including location tracking, offline data storage using SQLite, and interactive maps using Mapbox. This project is used internally for feature prototyping and experimentation.

## Features

- Real-time location tracking using Mapbox
- Offline data storage with SQLite
- Background and foreground location handling
- Data syncing when network is available
- Designed for Research & Development (R&D) purposes

## Built With

- [React Native](https://reactnative.dev/) - Mobile development framework
- [react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage) - Local database
- [Mapbox](https://docs.mapbox.com/react-native/maps/) - Maps and location services
- [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo) - Network state monitoring
- [react-native-get-location](https://github.com/gitim/react-native-get-location) - Geolocation access

## Getting Started

### Prerequisites

Before running the app, make sure you have:

- Node.js and npm or Yarn
- Android Studio or Xcode
- React Native CLI set up: [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- A Mapbox account and access token

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ttarreuu/RnD-SMJP.git
   cd RnD-SMJP
2. **Install depedencies:**

   ```bash
   yarn install
3. **Run the app:**
   ```bash
   npx react-native run-android

## Mapbox Setup

1. Sign up at [Mapbox](https://account.mapbox.com/)
2. Get your access token from your Mapbox dashboard
3. Follow the official [Mapbox React Native setup guide](https://docs.mapbox.com/react-native/maps/overview/) to configure Android and iOS environments

---

## Project Structure
```bash
RnD-SMJP/
├── android/ # Android native code
├── ios/ # iOS native code
├── database/ # SQLite database logic
│ └── database.js
├── components/ # Custom UI components
├── App.tsx # Main application entry
├── package.json # Project metadata and dependencies
└── ...


