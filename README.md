# ♿ Accessible Campus Map

> **An interactive, step-free navigation and accessibility tool designed for college students, staff, and campus visitors.**
> Built with vanilla **HTML5**, **CSS3**, and **JavaScript**, powered by **Leaflet.js** and **OpenStreetMap**.

---

## 📌 Project Status

This project is an **active educational demonstration prototype** developed to demonstrate accessible digital campus navigation. It implements responsive multi-floor schematics, debounced search, step-free route calculation, nearest amenity resolution, barrier reporting, and high-contrast styling.

> [!IMPORTANT]
> **Sample Demonstration Data Notice:**
> The current building layout, room numbers, door clearances, and coordinates in `js/data.js` are **sample demonstration data** representing a simulated academic engineering building (Main Academic Block). While core routing logic and verified starting point mappings are functional, the specific physical coordinates and facility ratings are demonstration examples and must be verified against certified university architectural surveys prior to any production deployment.

---

## 🧭 Genuine Implemented Features

- **Responsive Multi-Device Navigation:** Designed and tested across compact phones (320px–430px), tablets (768px–820px), and desktop displays with responsive touch controls and an accessible off-canvas drawer.
- **Multi-Level Floor Switching:** Native support for **Ground Floor (L0)**, **First Floor (L1)**, and **Second Floor (L2)**, dynamically updating map markers, room counts, and tactile approach pathways.
- **Room & Facility Search:** Instant, debounced text search across buildings, room numbers (e.g. `101`, `201`, `302`), labs, ramps, elevators, restrooms, and emergency exits with keyboard-navigable suggestions.
- **Building Context & Accessible Entrances:** Contextual badges link rooms to their parent buildings. Displays accessible entrance guidance with verified ramp slopes and door widths where available.
- **Verified "Route from Here" Feature:** Computes step-free paths directly from verified building entrances (`SP-NORTH-RAMP` for North Ramp R-01, `SP-PARK` for East Ramp R-02) into the building and destinations.
- **Step-Free Route Planning:** Computes wheelchair-friendly paths that avoid staircases, including elevator transfer guidance between floors, transit time estimates, and step-by-step instructions.
- **Stair & Step Alert System:** Highlights stairways with distinct visual warning pins and badges to help users with mobility aids prevent entering inaccessible paths.
- **Quick Assist Nearest Amenity Finder:** 1-tap resolution of the closest accessible amenity (restrooms, passenger lifts, drinking water points, entrance ramps) with automatic same-floor preference weighting.
- **Audio Route Guidance:** Built-in screen reader support via the Web Speech API to read turn-by-turn directions aloud.
- **Accessibility Barrier Reporting:** Interactive modal form allowing campus members to report temporary barriers (e.g., elevator out of service, blocked ramp) with client-side prototype persistence via browser `localStorage`.
- **Community Bulletin Feed:** A bulletin board for students and staff to share crowdsourced accessibility updates and study resource alerts with local upvoting.
- **Visual Accessibility & Contrast Modes:** Accessible toggle supporting high-contrast mode (exceeding WCAG 2.1 / 2.2 AA contrast standards) and a 3-stage font size adjuster (Normal, Large, Extra Large).

---

## 🛠️ Technologies Used

- **HTML5:** Semantic landmark architecture (`<nav>`, `<main>`, `<aside>`, `<article>`), ARIA live regions (`role="status"`, `role="alert"`), landmark focus attributes (`tabindex="-1"`), and WAI-ARIA tab navigation patterns.
- **CSS3:** Custom properties (CSS variables) for modular theming, WCAG AA contrast compliance (>4.5:1 against light surfaces), Flexbox and CSS Grid responsive layouts, GPU-accelerated compositing (`transform`, `opacity`), dynamic viewport heights (`100dvh`), and reduced-motion preferences (`prefers-reduced-motion`).
- **JavaScript (Vanilla ES6+):** Modular object-oriented architecture without external frameworks or bundlers. Features debounced input processing, Euclidean distance and floor-penalty heuristics, and `localStorage` state management.
- **Leaflet.js (v1.9.4):** Lightweight, mobile-friendly interactive mapping engine handling custom SVG category markers, floor-filtered layer groups (`L.layerGroup`), building footprint polygons, and route polylines.
- **OpenStreetMap:** Open tile layers providing realistic geographic and urban context surrounding campus buildings.

---

## 🚀 How to Run and Test on Windows 11 (Step-by-Step)

Because this application is built with vanilla HTML, CSS, and JavaScript, **no build tools, compilers, or database installations are required.**

### Method 1: The Quickest Way (Zero Setup - 10 Seconds)
1. Open **File Explorer** on Windows 11 (<kbd>Win</kbd> + <kbd>E</kbd>).
2. Navigate to the project directory: `D:\Antigravity`
3. Locate **`index.html`**.
4. **Double-click `index.html`** (or right-click and choose *Open with -> Google Chrome* or *Microsoft Edge*).
5. The Accessible Campus Map will open and run in your browser.

---

### Method 2: Using VS Code "Live Server" (Recommended for Development)
1. Open **Visual Studio Code**.
2. Go to **File -> Open Folder...** and select `D:\Antigravity`.
3. In the Extensions tab (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>), search for **"Live Server"** by *Ritwick Dey* and install it.
4. Right-click `index.html` in the file explorer and choose **"Open with Live Server"**.
5. Your default browser will open `http://127.0.0.1:5500/index.html`. File edits will automatically reload in real time.

---

### Method 3: Using Python Local HTTP Server
If Python is installed on your Windows machine:
1. Open Windows Terminal or PowerShell in `D:\Antigravity`.
2. Run:
   ```powershell
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---

## 📱 How to Test Mobile & Responsive Views

To test mobile behavior directly on your desktop:

1. Open the project in **Google Chrome** or **Microsoft Edge**.
2. Press <kbd>F12</kbd> (or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd>) to open Developer Tools.
3. Click the **Toggle device toolbar** button (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>).
4. Test across common device viewports:
   - **320px:** iPhone SE (1st generation) / compact Android
   - **360px:** Budget Android devices (Samsung Galaxy A series)
   - **375px:** iPhone SE (2nd/3rd gen), iPhone 12/13 mini
   - **390px:** iPhone 13/14/15
   - **430px:** iPhone 14/15/16 Pro Max
   - **768px & 820px:** Tablets (iPad Mini / iPad Air)
   - **1200px+:** Full Desktop
5. **Key Responsive Behaviors to Verify:**
   - The top header wraps gracefully without overlapping text or controls.
   - The hamburger button slides an off-canvas drawer with an accessible close button.
   - The map container automatically updates its dimensions via `ResizeObserver` without tile distortion.
   - The map legend collapses with a single tap to expand the visible map area.
   - Details cards provide a **"View on Map"** shortcut that slides the mobile drawer away smoothly.

---

## ⚡ Performance Optimizations Implemented

| Area | Optimization | Benefit on Budget & Mobile Devices |
| :--- | :--- | :--- |
| **Search Input** | 150ms debounce with instant clear | Prevents main-thread freezes and excessive DOM updates while typing on slower mobile processors. |
| **Leaflet Layers** | `L.layerGroup` batch updates | Groups marker additions and removals, minimizing map redraw operations. |
| **Map Resizing** | `ResizeObserver` + `requestAnimationFrame` | Prevents layout thrashing when the mobile navigation panel opens or closes. |
| **CSS Animations** | GPU-composited pseudo-element scaling | Uses `transform: scale()` and `opacity` instead of heavy continuous `box-shadow` repaints for alert pins. |
| **Mobile Form Controls** | `font-size: 16px` & 44px min touch targets | Prevents unwanted automatic zoom in mobile browsers while ensuring accessible tap targets. |
| **Viewport Sizing** | `height: 100dvh` with `100vh` fallback | Avoids vertical layout jumps when mobile browser address bars show or hide during scrolling. |

---

## 📂 File Architecture

```text
D:\Antigravity\
├── index.html               # Main HTML document with accessible landmark tags and ARIA attributes
├── README.md                # Project documentation and setup guide
├── css/
│   ├── style.css            # Responsive design system, layout rules, and Leaflet pin styling
│   └── accessibility.css    # High-contrast mode, focus visible rings, and reduced-motion support
└── js/
    ├── data.js              # Central sample dataset (buildings, floors, rooms, coordinates, amenities)
    ├── map.js               # Leaflet map controller, layer groups, ResizeObserver, and popups
    ├── search.js            # Debounced search and autocomplete engine
    ├── filters.js           # Category filter chips and floor switcher with live counts
    ├── routes.js            # Step-free route calculator, nearest amenity finder, and audio guidance
    ├── reports.js           # Barrier reporting form, validation, and localStorage manager
    ├── community.js         # Community bulletin board, post submission, and upvoting
    └── app.js               # Master application orchestrator, drawer management, and event listeners
```

---

## ⚠️ Limitations

1. **Sample / Simulated Data:** The building geometries, room coordinates, door measurements, and elevator technical specifications in `js/data.js` are sample demonstration values created for prototype testing. They do not represent official architectural surveys.
2. **Emergency Route Certification Disclaimer:** Paths and emergency exit locations are displayed strictly for general orientation and interface demonstration. **They are not certified for real-world emergency evacuation** (e.g. fire, earthquake). Users must always follow official campus emergency signage, alarms, and safety officer directions.
3. **Internet Requirement for Map Tiles:** Core interface controls, directory browsing, room search, path calculation, barrier reporting, and community updates function offline. However, interactive OpenStreetMap base tiles require an internet connection to download map imagery.
4. **Client-Side Prototype Storage:** User-submitted barrier reports and community updates are persisted in the browser's `localStorage` for testing purposes and are not linked to a live university backend or ticketing server.

---

## 🔮 Future Improvements

- **Official Campus GIS Integration:** Replacing simulated coordinates with official university spatial surveys and CAD/BIM floor plans.
- **Backend API & Facilities Ticketing:** Connecting the barrier reporting system to campus facilities management for real-time ticket tracking.
- **Indoor Positioning Support:** Exploring Bluetooth Low Energy (BLE) beacons, Wi-Fi RTT, or QR code checkpoint scans for real-time indoor blue-dot navigation.
- **Multi-Building Expansion:** Extending step-free routing across multiple academic, library, residential, and athletic complexes across the full university campus.
- **Localization:** Providing multi-language interface translations and regional language voice guidance.
