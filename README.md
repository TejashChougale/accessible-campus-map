# ♿ Accessible Campus Map

> **An interactive, step-free navigation and accessibility tool designed for college students, staff, and campus visitors.**
> Built with vanilla **HTML5**, **CSS3**, and **JavaScript**, powered by **Leaflet.js** and **CARTO Voyager** (OpenStreetMap contributors).

---

## 📌 Project Status & Geographic Context

This project is an **active educational demonstration prototype** developed to test accessible digital campus navigation concepts.

> [!IMPORTANT]
> **Campus Location & Simulated Model Notice:**
> - **Physical Institution:** The project is intended for the campus of **Basaveshwar Engineering College, Bagalkot, Karnataka** (approx. **16.172306° N, 75.658694° E**).
> - **Simulated Prototype Coordinate Framework:** For software engineering and user interface demonstration, the current interactive map operates within a simulated 3-story academic building schematic placed at prototype coordinates (`12.93485, 77.53535`).
> - **Demonstration Facilities:** Passenger elevators (**L-01** and **L-02**), entrance ramps (**R-01** and **R-02**), door widths, ramp gradients, and room layout coordinates in `js/data.js` are **simulated prototype demonstration data** created to model multi-floor accessible pathfinding. They are **not confirmed or certified physical campus facilities** of the actual Bagalkot college building.
> - **Production Requirement:** Before any real-world navigational deployment, all building geometries, room locations, entrance clearances, and elevator specifications must be replaced with certified on-site architectural and GIS surveys.

---

## 🧭 Genuine Implemented Features

- **Responsive Multi-Device Navigation:** Designed and simulated across compact phones (320px–430px), tablets (768px–820px), and desktop displays with responsive touch controls and an accessible off-canvas drawer.
- **Multi-Level Floor Switching:** Native support for **Ground Floor (L0)**, **First Floor (L1)**, and **Second Floor (L2)**, dynamically updating map markers, room counts, and tactile approach pathways.
- **Room & Facility Search:** Instant, debounced text search across buildings, room numbers (e.g. `101`, `201`, `302`), labs, ramps, elevators, restrooms, and emergency exits with keyboard-navigable suggestions.
- **Building Context & Accessible Entrances:** Contextual badges link rooms to their parent buildings. Displays accessible entrance guidance with simulated ramp slopes and door widths from the prototype schematic.
- **Prototype "Route from Here" Feature:** Computes step-free paths directly from mapped demonstration building entrances (`SP-NORTH-RAMP` for North Ramp R-01, `SP-EAST-RAMP` for East Ramp R-02) into the building and destinations.
- **Step-Free Route Planning & Dynamic Lift Evaluation:** Computes wheelchair-friendly paths that avoid staircases, including dynamic evaluation of candidate elevators (L-01 and L-02) based on calculated walking distance to demonstrate optimal elevator selection.
- **Stair & Step Alert System:** Highlights stairways with distinct visual warning pins and badges to help users with mobility aids prevent entering inaccessible paths.
- **Quick Assist Nearest Amenity Finder:** 1-tap resolution of the closest accessible amenity (restrooms, passenger lifts, drinking water points, entrance ramps) with automatic same-floor preference weighting.
- **Audio Route Guidance:** Spoken turn-by-turn route assistance powered by the Web Speech API (synthesized voice assistance; does not replace native system screen readers like NVDA or VoiceOver).
- **Accessibility Barrier Reporting:** Interactive modal form allowing campus members to report temporary barriers (e.g., elevator out of service, blocked ramp) with client-side prototype persistence via browser `localStorage`.
- **Community Bulletin Feed:** A bulletin board for students and staff to share crowdsourced accessibility updates and study resource alerts with local upvoting.
- **Visual Accessibility & Contrast Modes:** Accessible toggle supporting high-contrast mode (aligned with WCAG 2.1 AA contrast standards) and a 3-stage font size adjuster (Normal, Large, Extra Large).

---

## 🛠️ Technologies Used

- **HTML5:** Semantic landmark architecture (`<nav>`, `<main>`, `<aside>`, `<article>`), ARIA live regions (`role="status"`, `role="alert"`), landmark focus attributes (`tabindex="-1"`), and WAI-ARIA tab navigation patterns.
- **CSS3:** Custom properties (CSS variables) for modular theming, WCAG AA contrast compliance (>=4.5:1 against light surfaces), Flexbox and CSS Grid responsive layouts, GPU-accelerated compositing (`transform`, `opacity`), dynamic viewport heights (`100dvh`), and reduced-motion preferences (`prefers-reduced-motion`).
- **JavaScript (Vanilla ES6+):** Modular object-oriented architecture without external frameworks or bundlers. Features debounced input processing, Euclidean distance and floor-penalty heuristics, and `localStorage` state management.
- **Leaflet.js (v1.9.4):** Lightweight, mobile-friendly interactive mapping engine handling custom SVG category markers, floor-filtered layer groups (`L.layerGroup`), building footprint polygons, and route polylines.
- **CARTO Voyager / OpenStreetMap:** High-clarity raster tiles providing geographic context surrounding campus buildings.

---

## 🚀 How to Run and Test Locally

Because this application is built with vanilla HTML, CSS, and JavaScript, **no build tools, compilers, or database installations are required.**

### Method 1: The Quickest Way (Zero Setup)
1. Clone the repository:
   ```bash
   git clone https://github.com/<owner>/accessible-campus-map.git
   cd accessible-campus-map
   ```
2. Double-click `index.html` (or right-click and choose *Open with -> Google Chrome* or *Microsoft Edge*).
3. The Accessible Campus Map will open and run in your browser.

---

### Method 2: Using Python Local HTTP Server
If Python is installed on your machine:
1. Open PowerShell or a terminal in the project directory.
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---

### Method 3: Using VS Code "Live Server"
1. Open **Visual Studio Code**.
2. Go to **File -> Open Folder...** and select the project directory.
3. In the Extensions tab (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>), install **"Live Server"** by *Ritwick Dey*.
4. Right-click `index.html` in the file explorer and choose **"Open with Live Server"**.
5. Your default browser will open `http://127.0.0.1:5500/index.html`.

---

## 📱 How to Test Mobile & Responsive Views

To test mobile behavior directly on your desktop:

1. Open the project in **Google Chrome** or **Microsoft Edge**.
2. Press <kbd>F12</kbd> (or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd>) to open Developer Tools.
3. Click the **Toggle device toolbar** button (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>).
4. Test across common responsive device viewports:
   - **320px–360px:** Compact mobile viewports
   - **375px–430px:** Modern smartphone viewports
   - **768px–820px:** Tablet viewports
   - **1024px+:** Desktop viewports
5. **Key Responsive Behaviors to Verify:**
   - The top header wraps gracefully without overlapping text or controls.
   - The hamburger button slides an off-canvas drawer with an accessible close button.
   - Selecting a location on mobile viewports automatically closes the drawer and displays the map.
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
accessible-campus-map/
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

## ⚠️ Limitations & Data Integrity Disclosures

1. **Geographic Coordinates & Campus Location:** The physical college campus is located in Bagalkot, Karnataka (**16.172306° N, 75.658694° E**). The current software prototype uses a simulated demonstration layout with coordinates in an arbitrary Bangalore bounding box (`12.93485, 77.53535`). These coordinates do not represent GPS coordinates of the real college building.
2. **Prototype Facilities (Lifts & Ramps):** Passenger elevators (`L-01`, `L-02`) and entrance ramps (`R-01`, `R-02`) are **simulated prototype model facilities** created to develop and test multi-floor route calculations. They are not confirmed real-world facilities in the Bagalkot campus building.
3. **Route Distance & Measurement Assumptions:** Distances reported by the route planner (e.g. 22m entrance approach, 114m total path) are mathematical model estimates based on the simulated coordinate grid, not on-site physical surveyor measurements.
4. **Emergency Route Certification Disclaimer:** Paths and emergency exit locations are displayed strictly for general orientation and interface demonstration. **They are not certified for real-world emergency evacuation** (e.g. fire, earthquake). Users must always follow official campus emergency signage, alarms, and safety officer directions.
5. **Internet Requirement for Map Tiles:** Core interface controls, directory browsing, room search, path calculation, barrier reporting, and community updates function offline. However, interactive CARTO Voyager base tiles require an internet connection to download map imagery.
6. **Client-Side Prototype Storage:** User-submitted barrier reports and community updates are persisted in the browser's `localStorage` for testing purposes and are not linked to a live university backend or ticketing server.

---

## 🔮 Future Improvements

- **Official Campus GIS Integration:** Replacing simulated prototype coordinates (`12.934...`) with certified university spatial surveys and CAD/BIM floor plans from the actual Bagalkot campus (`16.172306, 75.658694`).
- **Verified Facility Audits:** Conducting certified on-site accessibility audits to map genuine elevators, ramps, door clearances, and tactile paths.
- **Backend API & Facilities Ticketing:** Connecting the barrier reporting system to campus facilities management for real-time ticket tracking.
- **Indoor Positioning Support:** Exploring Bluetooth Low Energy (BLE) beacons, Wi-Fi RTT, or QR code checkpoint scans for real-time indoor blue-dot navigation.
- **Multi-Building Expansion:** Extending step-free routing across multiple academic, library, residential, and athletic complexes across the full university campus.
- **Localization:** Providing multi-language interface translations and regional language voice guidance.
