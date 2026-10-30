/**
 * ACCESSIBLE CAMPUS MAP - MAP INITIALIZATION & RENDERING ENGINE
 * 
 * Uses Leaflet.js with OpenStreetMap / CartoDB tiles.
 * Handles custom SVG accessibility markers, floor plan overlays,
 * layer switching, and interactive route rendering.
 */

class CampusMapController {
  constructor(data) {
    this.data = data;
    this.map = null;
    this.currentFloor = "L0"; // Default: Ground Floor
    this.currentBuilding = "block-a";
    this.activeFilters = new Set(Object.keys(data.categories));
    this.markers = [];
    this.buildingLayers = [];
    this.markerLayerGroup = null;
    this.routeLayerGroup = null;
    this.walkwayLayerGroup = null;
    this.activeTileLayer = null;
    this.isHighContrast = false;
    this.selectedLocation = null;
    this.resizeObserver = null;

    // Callbacks to notify UI
    this.onLocationSelected = null;
    this.onBuildingSelected = null;
  }

  /**
   * Initializes Leaflet Map instance
   */
  init(mapElementId = "map") {
    const el = document.getElementById(mapElementId);
    if (!el) {
      console.error(`Map container #${mapElementId} not found.`);
      return;
    }

    // Check if Leaflet library is loaded from CDN
    if (typeof L === "undefined") {
      console.warn("Leaflet library not loaded (offline mode). Rendering fallback.");
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; color: #475569; background: #f8fafc;">
          <div style="font-size: 3rem; color: #2563eb; margin-bottom: 1rem;">
            <i class="fa-solid fa-map-location-dot"></i>
          </div>
          <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Interactive Map (Requires Internet for Tiles)</h2>
          <p style="max-width: 480px; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem; color: #64748b;">
            Connect to the internet to load OpenStreetMap satellite and street tiles via Leaflet CDN. All sidebar features, room search, directory, directions, issue reporting, and community updates are active.
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-primary" style="width: auto;" onclick="location.reload()">
              <i class="fa-solid fa-rotate-right"></i> Retry Connection
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Initialize Leaflet map with mobile-optimized settings
    this.map = L.map(mapElementId, {
      center: this.data.campusCenter,
      zoom: this.data.defaultZoom,
      minZoom: 16,
      maxZoom: 20,
      zoomControl: false, // Custom placed zoom control for accessibility
      tap: !L.Browser.mobile, // Disable Leaflet tap emulation on modern mobile to avoid click delays
      fadeAnimation: true,
      zoomAnimation: true
    });

    // Add Accessible Zoom controls at bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Add Base Tile Layer (Carto Voyager - clean, high legibility, free & open)
    this.setTileLayer("voyager");

    // Layer Groups for performance (batch addition/clearing)
    this.markerLayerGroup = L.layerGroup().addTo(this.map);
    this.routeLayerGroup = L.layerGroup().addTo(this.map);
    this.walkwayLayerGroup = L.layerGroup().addTo(this.map);

    // Draw campus boundary and building footprints
    this.renderBuildingFootprints();

    // Render markers for current floor
    this.updateMarkers();

    // Resize observer to automatically invalidate size when container or sidebar changes
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.invalidateMapSize();
      });
      this.resizeObserver.observe(el);
    } else {
      window.addEventListener("resize", () => this.invalidateMapSize(), { passive: true });
    }

    // Window orientation change on phones
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.invalidateMapSize(), 200);
    }, { passive: true });

    // Map click resets selection if clicked on blank space
    this.map.on("click", (e) => {
      // If clicked outside markers
      if (e.originalEvent.target.classList.contains("leaflet-container")) {
        // Can optionally close details
      }
    });

    console.log("Accessible Campus Map initialized successfully.");
  }

  /**
   * Smoothly invalidates and resizes the Leaflet map container
   */
  invalidateMapSize() {
    if (!this.map) return;
    requestAnimationFrame(() => {
      this.map.invalidateSize({ animate: false });
    });
  }

  /**
   * Sets the map tile layer style (standard, high contrast, or satellite-like)
   */
  setTileLayer(type = "voyager") {
    if (this.activeTileLayer && this.map) {
      this.map.removeLayer(this.activeTileLayer);
    }

    let tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    if (type === "dark") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    } else if (type === "osm") {
      tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    }

    this.activeTileLayer = L.tileLayer(tileUrl, {
      attribution: attribution,
      maxZoom: 20,
      subdomains: "abcd",
      keepBuffer: 3,
      updateWhenIdle: true,
      updateWhenZooming: false
    }).addTo(this.map);
  }

  /**
   * Render building polygons and schematic floor layout outlines
   */
  renderBuildingFootprints() {
    // Campus Area Boundary
    if (this.data.campusBoundary) {
      L.polygon(this.data.campusBoundary, {
        color: "#94a3b8",
        weight: 1.5,
        dashArray: "4, 6",
        fillColor: "#f8fafc",
        fillOpacity: 0.2,
        interactive: false
      }).addTo(this.map);
    }

    // Main Academic Block footprint
    const mainBuilding = this.data.buildings.find(b => b.id === "block-a");
    if (mainBuilding && mainBuilding.polygon) {
      const bPoly = L.polygon(mainBuilding.polygon, {
        color: "#2563eb",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        interactive: true
      }).addTo(this.map);

      bPoly.buildingId = mainBuilding.id;

      bPoly.bindTooltip(`<b>${mainBuilding.name}</b><br><small>Click to view building details</small>`, {
        direction: "top",
        className: "campus-tooltip"
      });

      bPoly.bindPopup(`
        <div class="popup-card">
          <div class="popup-header">
            <span class="popup-badge badge-step-free">
              <i class="fa-solid fa-check"></i> Step-Free Accessible
            </span>
            <span class="popup-category" style="color: #2563eb">
              <i class="fa-solid fa-building"></i> Academic Building
            </span>
          </div>
          <h3 class="popup-title">${mainBuilding.name}</h3>
          <p class="popup-meta"><strong>Building Code:</strong> ${mainBuilding.code}</p>
          <p class="popup-notes">${mainBuilding.description}</p>
          <div class="popup-actions" style="margin-top: 0.75rem;">
            <button class="popup-btn btn-primary" onclick="window.CampusApp.openBuildingDetailsDrawer('${mainBuilding.id}')">
              <i class="fa-solid fa-circle-info"></i> View Building Details
            </button>
          </div>
        </div>
      `, { maxWidth: 320, className: "campus-leaflet-popup" });

      bPoly.on("click", () => {
        this.focusBuilding(mainBuilding.id);
        if (typeof this.onBuildingSelected === "function") {
          this.onBuildingSelected(mainBuilding);
        }
      });

      this.buildingLayers.push(bPoly);
    }

    // Render Walkway paths
    this.renderCampusWalkways();
  }

  /**
   * Renders simulated accessible pathways on the campus surface
   */
  renderCampusWalkways() {
    if (!this.map || !this.walkwayLayerGroup) return;
    this.walkwayLayerGroup.clearLayers();

    // Dedicated entrance approach walkways (no artificial Gate-to-Park connector)
    const accessibleWalkways = [
      // From Campus Gate to North Main Entrance Ramp (R-01)
      [
        [12.93560, 77.53530],
        [12.93527, 77.53530]
      ],
      // From Accessible Parking Bay to East Wing Ramp (R-02)
      [
        [12.93480, 77.53630],
        [12.93480, 77.53587]
      ]
    ];

    accessibleWalkways.forEach(path => {
      L.polyline(path, {
        color: "#059669",
        weight: 3.5,
        dashArray: "4, 6",
        opacity: 0.65,
        lineCap: "round"
      }).addTo(this.walkwayLayerGroup).bindTooltip("Tactile Step-Free Paved Walkway", {
        direction: "center",
        className: "campus-tooltip"
      });
    });
  }

  /**
   * Generates a custom SVG icon for each category
   */
  createCustomMarkerIcon(location) {
    const cat = this.data.categories[location.category] || {
      color: "#2563eb",
      icon: "fa-location-dot"
    };

    // Distinguish stairs with special high-visibility alert icon
    const isStairs = location.category === "stairs";
    const isRamp = location.category === "ramps";
    const isLift = location.category === "lifts";

    const markerHtml = `
      <div class="custom-map-pin ${isStairs ? 'pin-stairs' : ''} ${isRamp ? 'pin-ramp' : ''} ${isLift ? 'pin-lift' : ''}" 
           style="--pin-color: ${cat.color};"
           role="img" 
           aria-label="${location.name} (${cat.label})">
        <div class="pin-badge">
          <i class="fa-solid ${cat.icon}"></i>
        </div>
        <div class="pin-pulse"></div>
        <div class="pin-label">${location.code || ''}</div>
      </div>
    `;

    return L.divIcon({
      html: markerHtml,
      className: "custom-leaflet-pin",
      iconSize: [36, 46],
      iconAnchor: [18, 42],
      popupAnchor: [0, -38]
    });
  }

  /**
   * Updates map markers based on active floor and active category filters
   */
  updateMarkers() {
    if (!this.map) return;

    // Clear existing markers efficiently
    if (this.markerLayerGroup) {
      this.markerLayerGroup.clearLayers();
    } else {
      this.markerLayerGroup = L.layerGroup().addTo(this.map);
    }
    this.markers = [];

    // Filter locations by current floor AND active categories
    const visibleLocations = this.data.locations.filter(loc => {
      // Floor matching:
      // Show locations for the selected floor, OR outdoor waypoints if on Ground Floor (L0)
      const floorMatch = (loc.floorId === this.currentFloor) ||
                         (loc.buildingId === "outdoor" && this.currentFloor === "L0");
      
      // Category filter matching
      const catMatch = this.activeFilters.has(loc.category);

      return floorMatch && catMatch;
    });

    const isSmallScreen = typeof window !== "undefined" && window.innerWidth <= 600;
    const popupMaxWidth = isSmallScreen ? Math.min(290, window.innerWidth - 32) : 320;

    visibleLocations.forEach(loc => {
      const icon = this.createCustomMarkerIcon(loc);
      const marker = L.marker(loc.coords, {
        icon: icon,
        title: loc.name,
        keyboard: true,
        alt: `${loc.name} - ${loc.accessibilityRating}`
      });

      // Bind accessible popup with responsive constraints
      const popupHtml = this.generatePopupContent(loc);
      marker.bindPopup(popupHtml, {
        maxWidth: popupMaxWidth,
        minWidth: Math.min(230, popupMaxWidth),
        className: "custom-accessible-popup",
        autoPanPadding: [16, 16]
      });

      // Marker click event
      marker.on("click", () => {
        this.selectLocation(loc);
      });

      this.markerLayerGroup.addLayer(marker);
      this.markers.push(marker);
    });

    console.log(`Rendered ${visibleLocations.length} locations on floor ${this.currentFloor}`);
  }

  /**
   * Generates formatted popup HTML with accessibility details and quick action buttons
   */
  generatePopupContent(loc) {
    const cat = this.data.categories[loc.category] || {};
    const isStepFree = loc.stepFree;

    let buildingLabel = "";
    if (loc.buildingId === "outdoor") {
      buildingLabel = "Outdoor Campus Grounds";
    } else if (this.data && Array.isArray(this.data.buildings)) {
      const b = this.data.buildings.find(item => item.id === loc.buildingId);
      if (b) {
        buildingLabel = b.name;
      }
    }

    let emergencyNoticeHtml = "";
    if (loc.category === "emergency") {
      emergencyNoticeHtml = `
        <div class="popup-alert-box alert-emergency" role="note">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span><strong>Notice:</strong> Emergency exit information is provided for general awareness only. Do not rely on this map for emergency evacuation. Follow official campus instructions.</span>
        </div>
      `;
    }

    return `
      <div class="popup-card">
        <div class="popup-header">
          <span class="popup-badge ${isStepFree ? 'badge-step-free' : 'badge-alert'}">
            <i class="fa-solid ${isStepFree ? 'fa-check' : 'fa-triangle-exclamation'}" aria-hidden="true"></i>
            ${isStepFree ? 'Step-Free Accessible' : 'Stairs Alert'}
          </span>
          <span class="popup-category" style="color: ${cat.color}">
            <i class="fa-solid ${cat.icon}"></i> ${this.escapeHtml(cat.label || '')}
          </span>
        </div>

        <h3 class="popup-title">${this.escapeHtml(loc.name)}</h3>
        <p class="popup-meta">
          ${buildingLabel ? `<strong>Building:</strong> ${this.escapeHtml(buildingLabel)}<br>` : ''}
          <strong>Room/ID:</strong> ${this.escapeHtml(loc.code || 'N/A')} | 
          <strong>Floor:</strong> ${this.escapeHtml(this.getFloorName(loc.floorId))}
        </p>

        ${emergencyNoticeHtml}

        <div class="popup-specs">
          ${loc.doorWidthCm ? `<div class="spec-item"><i class="fa-solid fa-door-open"></i> Door: ${loc.doorWidthCm} cm</div>` : ''}
          ${loc.slopeGradient ? `<div class="spec-item"><i class="fa-solid fa-chart-line"></i> Slope: ${loc.slopeGradient}</div>` : ''}
          ${loc.stepCount ? `<div class="spec-item alert-text"><i class="fa-solid fa-stairs"></i> ${loc.stepCount} Steps (No Ramp)</div>` : ''}
          ${loc.capacityKg ? `<div class="spec-item"><i class="fa-solid fa-weight-hanging"></i> Cap: ${loc.capacityKg} kg</div>` : ''}
        </div>

        <p class="popup-notes">${this.escapeHtml(loc.notes || '')}</p>

        <div class="popup-actions">
          <button class="popup-btn btn-primary" onclick="window.CampusApp.routeToLocation('${loc.id}')">
            <i class="fa-solid fa-diamond-turn-right"></i> Directions Here
          </button>
          <button class="popup-btn btn-secondary" onclick="window.CampusApp.showLocationDetails('${loc.id}')">
            <i class="fa-solid fa-circle-info"></i> Full Details
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Helper to get floor human readable name
   */
  getFloorName(floorId) {
    if (floorId === "L0") return "Ground Floor (L0)";
    if (floorId === "L1") return "First Floor (L1)";
    if (floorId === "L2") return "Second Floor (L2)";
    return floorId;
  }

  /**
   * Safe HTML escaping helper
   */
  escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  /**
   * Select a location, focus on map, and notify listener
   */
  selectLocation(loc, notify = true) {
    const isDifferent = !this.selectedLocation || this.selectedLocation.id !== loc.id;
    this.selectedLocation = loc;

    // Pan map smoothly to the location
    if (this.map && loc.coords) {
      this.map.flyTo(loc.coords, 19, {
        duration: 1.0,
        easeLinearity: 0.25
      });
    }

    // Only notify if explicit and different to prevent mutual recursion loops
    if (notify && isDifferent && typeof this.onLocationSelected === "function") {
      this.onLocationSelected(loc);
    }
  }

  /**
   * Switch the current floor level
   */
  switchFloor(floorId) {
    if (this.currentFloor === floorId) return;

    this.currentFloor = floorId;
    this.updateMarkers();

    // Outdoor walkways belong only on Ground Floor (L0)
    if (this.walkwayLayerGroup && this.map) {
      if (floorId === "L0") {
        if (!this.map.hasLayer(this.walkwayLayerGroup)) {
          this.map.addLayer(this.walkwayLayerGroup);
        }
      } else {
        if (this.map.hasLayer(this.walkwayLayerGroup)) {
          this.map.removeLayer(this.walkwayLayerGroup);
        }
      }
    }

    this.invalidateMapSize();
    console.log(`Floor switched to ${floorId}`);
  }

  /**
   * Toggle category filter
   */
  toggleCategory(categoryId, isChecked) {
    if (isChecked) {
      this.activeFilters.add(categoryId);
    } else {
      this.activeFilters.delete(categoryId);
    }
    this.updateMarkers();
  }

  /**
   * Set all filters active or clear all
   */
  setAllFilters(enableAll = true) {
    if (enableAll) {
      this.activeFilters = new Set(Object.keys(this.data.categories));
    } else {
      this.activeFilters.clear();
    }
    this.updateMarkers();
  }

  /**
   * Focus building bounds, highlight footprint polygon, and open info popup
   */
  focusBuilding(buildingId) {
    if (!this.map) {
      this.init("map");
    }
    if (!this.map) return;

    this.invalidateMapSize();

    const building = this.data.buildings.find(b => b.id === buildingId);
    if (building && building.polygon) {
      const bounds = L.latLngBounds(building.polygon);
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
      
      // Highlight polygon and open building popup if available
      if (this.buildingLayers && this.buildingLayers.length > 0) {
        const poly = this.buildingLayers.find(l => l.buildingId === buildingId) || this.buildingLayers[0];
        if (poly) {
          if (typeof poly.setStyle === "function") {
            poly.setStyle({
              color: "#1d4ed8",
              weight: 4,
              fillColor: "#2563eb",
              fillOpacity: 0.28
            });
            setTimeout(() => {
              if (poly && typeof poly.setStyle === "function") {
                poly.setStyle({
                  color: "#2563eb",
                  weight: 2,
                  fillColor: "#3b82f6",
                  fillOpacity: 0.12
                });
              }
            }, 3500);
          }
          if (typeof poly.openPopup === "function") {
            setTimeout(() => poly.openPopup(), 250);
          }
        }
      }
    }
  }

  /**
   * Reset map view to the whole campus center
   */
  resetView() {
    if (!this.map) return;
    this.map.flyTo(this.data.campusCenter, this.data.defaultZoom, {
      duration: 0.8
    });
  }

  /**
   * Draw a route on the map
   */
  drawRoute(pathCoordinates, isStepFree = true) {
    if (!this.map || !this.routeLayerGroup) return;
    this.routeLayerGroup.clearLayers();

    if (!pathCoordinates || pathCoordinates.length < 2) return;

    // Glowing base line
    L.polyline(pathCoordinates, {
      color: isStepFree ? "#059669" : "#dc2626",
      weight: 8,
      opacity: 0.35,
      lineCap: "round"
    }).addTo(this.routeLayerGroup);

    // Active route line
    const mainLine = L.polyline(pathCoordinates, {
      color: isStepFree ? "#10b981" : "#ef4444",
      weight: 5,
      dashArray: "8, 10",
      lineCap: "round",
      opacity: 0.95
    }).addTo(this.routeLayerGroup);

    // Start marker
    const startIcon = L.divIcon({
      html: `<div class="route-point-marker route-start"><i class="fa-solid fa-play"></i></div>`,
      className: "route-marker-container",
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker(pathCoordinates[0], { icon: startIcon, title: "Start Point" }).addTo(this.routeLayerGroup);

    // End marker
    const endIcon = L.divIcon({
      html: `<div class="route-point-marker route-end"><i class="fa-solid fa-flag-checkered"></i></div>`,
      className: "route-marker-container",
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker(pathCoordinates[pathCoordinates.length - 1], { icon: endIcon, title: "Destination" }).addTo(this.routeLayerGroup);

    // Fit map bounds to show complete route
    const routeBounds = L.latLngBounds(pathCoordinates);
    this.map.fitBounds(routeBounds, { padding: [60, 60], maxZoom: 19 });
  }

  /**
   * Clear active route line
   */
  clearRoute() {
    if (this.routeLayerGroup) {
      this.routeLayerGroup.clearLayers();
    }
  }

  /**
   * Toggle high contrast visuals
   */
  toggleHighContrast(enabled) {
    this.isHighContrast = enabled;
    this.setTileLayer(enabled ? "dark" : "voyager");
  }
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.CampusMapController = CampusMapController;
}
