# ♿ Accessible Campus Map

> **An inclusive, step-free navigation and accessibility tool for college students, staff, and visitors.**  
> Built using vanilla **HTML5, CSS3, and JavaScript**, powered by **Leaflet.js** and **OpenStreetMap**.

---

## 📌 Project Overview

Navigating a university campus can be challenging for students with mobility impairments, wheelchair users, students on temporary crutches, or visually impaired visitors. 

The **Accessible Campus Map** provides:
- **Responsive Navigation for All Screens:** Engineered to work seamlessly on phones (320px, 360px, 375px, 390px, 430px), tablets, and desktop displays.
- **Interactive Outdoor & Indoor Schematics:** Clearly marks ramps, lifts/elevators, universal accessible washrooms, lowered drinking water stations, quiet seating zones, and emergency evacuation refuge areas.
- **Room Search & Turn-by-Turn Directions:** Search classrooms by number (e.g. `101`, `201`, `302`) and get step-free routes that avoid stairs.
- **Stair & Obstacle Alerts:** Staircases are highlighted with clear warnings so wheelchair users are never directed into dead-ends.
- **Audio Route Guidance:** Text-to-speech screen reader support reads directions aloud with a single click.
- **Barrier Reporting System:** Students can flag broken lifts, blocked ramps, or suggest room corrections, saved in real-time in the browser (`localStorage`).
- **Community Bulletin Board:** A crowdsourced feed for students to post live accessibility tips and upvote helpful alerts.
- **Visual Accessibility Modes:** One-click WCAG 2.1 AAA High Contrast mode (yellow/black) and font size adjusters.
- **Lightweight & Budget-Phone Optimized:** Zero external framework bloat, debounced search inputs, GPU-composited CSS transforms, and dynamic viewport height handling (`100dvh`).

---

## 🚀 How to Run and Test on Windows 11 (Step-by-Step)

Because this website is built with clean vanilla HTML, CSS, and JavaScript, **you do not need to install complex build tools or configure databases.**

### Method 1: The Quickest Way (Zero Setup - 10 Seconds)
1. Open **File Explorer** on Windows 11 (`Win + E`).
2. Navigate to your project folder: `D:\Antigravity`
3. Find the file named **`index.html`**.
4. **Double-click `index.html`** (or right-click and choose *Open with -> Google Chrome* or *Microsoft Edge*).
5. The Accessible Campus Map will instantly open and run in your browser!

---

### Method 2: Using VS Code "Live Server" (Recommended for Students)
If you are learning web development with Visual Studio Code:
1. Open **VS Code**.
2. Go to **File -> Open Folder...** and select `D:\Antigravity`.
3. In the left Extensions tab (`Ctrl + Shift + X`), search for **"Live Server"** by *Ritwick Dey* and click **Install**.
4. Right-click `index.html` in the file explorer and click **"Open with Live Server"**.
5. Your default browser will automatically open `http://127.0.0.1:5500/index.html`. Any edits you make to the code will refresh automatically!

---

## 📱 How to Test Mobile & Responsive Views

To test how the website behaves on mobile devices directly on your Windows 11 desktop:

1. Open the website in **Google Chrome** or **Microsoft Edge**.
2. Press <kbd>F12</kbd> (or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd>) to open Developer Tools.
3. Click the **Toggle device toolbar** button (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>).
4. Test across different device presets and widths:
   - **320px:** iPhone SE (1st gen)
   - **360px:** Samsung Galaxy A series / budget Android
   - **375px:** iPhone SE (2nd/3rd gen), iPhone 12/13 mini
   - **390px:** iPhone 13/14/15
   - **430px:** iPhone 14/15/16 Pro Max
   - **768px & 820px:** iPad Mini / iPad Air
   - **1200px+:** Full Desktop
5. **Notice Mobile Optimizations:**
   - The header neatly reflows into two non-overlapping rows.
   - The hamburger menu opens an off-canvas drawer with an easy-to-reach close button.
   - The map automatically recalculates its dimensions via `ResizeObserver` with no grey tiles.
   - The map legend is collapsible with a single tap to maximize map visibility.
   - Route and room details cards include a **"View on Map"** button that slides the drawer away instantly.

---

## ⚡ Performance Optimizations Implemented

| Area | Optimization | Benefit on Budget Devices |
| :--- | :--- | :--- |
| **Search Input** | 150ms debounce with instant clear | Prevents main thread freeze and constant DOM reconstruction on slow Android keyboards. |
| **Leaflet Layers** | `L.layerGroup` batch updates | Replaces individual `map.addLayer()` calls with grouped batch DOM insertions. |
| **Map Resizing** | `ResizeObserver` + `requestAnimationFrame` | Eliminates tile layout thrashing when the mobile drawer slides in and out. |
| **CSS Animations** | GPU-composited pseudo-element scaling | Replaced continuous `box-shadow` repaints on alert pins with zero-layout GPU transforms (`scale` + `opacity`). |
| **Mobile Inputs** | `font-size: 16px` & 44px min touch targets | Prevents iOS Safari automatic screen zooming while maintaining WCAG 2.5.5 touch target standards. |
| **Viewport Height** | `height: 100dvh` with `100vh` fallback | Prevents page vertical jumping when mobile browser URL bars appear/disappear. |

---

## 📂 File Architecture

```text
D:\Antigravity\
├── index.html               # Main HTML document with accessible semantic tags and ARIA roles
├── README.md                # Documentation and guide
├── css/
│   ├── style.css            # Responsive design system, mobile breakpoints, Leaflet pin styles
│   └── accessibility.css    # WCAG AAA High Contrast mode, focus rings, reduced motion
└── js/
    ├── data.js              # Central sample data store (buildings, floors, rooms, coordinates, notes)
    ├── map.js               # Leaflet map setup, batch layer groups, ResizeObserver, responsive popups
    ├── search.js            # Fast debounced search autocomplete with keyboard support
    ├── filters.js           # Category chips & floor switcher with dynamic room counters
    ├── routes.js            # Step-by-step accessible route calculator & text-to-speech speaker
    ├── reports.js           # Barrier reporting form & status tracker (with localStorage)
    ├── community.js         # Community bulletin board & helpful upvotes (with localStorage)
    └── app.js               # Master application controller, drawer management, and event bindings
```

---

## ⚠️ Sample Data & Real-World Limitations

1. **Simulated Schematics:** All building coordinates, room numbers, accessibility specs, and pathways in `data.js` are sample demonstration data for educational prototyping.
2. **Offline Limitations:** Core controls, room search, directory, route planning, barrier reporting, and community bulletin function completely offline. However, interactive OpenStreetMap map tiles require an internet connection to fetch map images.
3. **Emergency Certification:** Step-free routes and refuge zones are algorithmic estimates and must be verified by campus safety officers before being used in real fire or evacuation emergencies.
