/**
 * ACCESSIBLE CAMPUS MAP - MAIN APPLICATION ORCHESTRATOR
 * 
 * Coordinates all modules:
 * - Map Controller (Leaflet & markers)
 * - Search Controller (Fuzzy search & auto-complete)
 * - Filter Controller (Categories & floor levels)
 * - Route Planner (Step-free pathfinding)
 * - Reports Manager (Barriers & corrections)
 * - Community Feed (Student bulletin)
 * - Accessibility Settings (High contrast, Font scale, Audio)
 */

class CampusApp {
  constructor() {
    this.data = window.CAMPUS_DATA;
    this.map = null;
    this.search = null;
    this.filters = null;
    this.router = null;
    this.reports = null;
    this.community = null;

    this.activeTab = "explore"; // "explore", "routes", "directory", "community", "reports"
    this.currentFontSize = 1; // 1 = normal, 1.15 = large, 1.3 = x-large
    this.isHighContrast = false;
  }

  init() {
    console.log("Starting Accessible Campus Map prototype...");

    // 1. Initialize Map
    this.map = new CampusMapController(this.data);
    this.map.init("map");

    // 2. Initialize Search
    this.search = new CampusSearch(this.data, this.map);
    this.search.init("campusSearchInput", "searchResultsDropdown");

    // 3. Initialize Filters & Floor switcher
    this.filters = new CampusFilters(this.data, this.map);
    this.filters.init("categoryFiltersGroup", "floorSwitcherGroup");

    // 4. Initialize Route Planner
    this.router = new CampusRouter(this.data, this.map);
    this.populateRouteDropdowns();

    // 5. Initialize Reports Manager
    this.reports = new CampusReportsManager(this.data);
    this.reports.renderReportsList("reportsListContainer", "all");

    // 6. Initialize Community Feed
    this.community = new CampusCommunityFeed(this.data);
    this.community.renderFeed("communityFeedContainer");

    // 7. Bind Location & Building selection events from map
    this.map.onLocationSelected = (loc) => {
      this.showLocationDetails(loc.id);
    };
    this.map.onBuildingSelected = (building) => {
      this.showBuildingDetails(building.id);
    };

    // 8. Bind UI Tabs, Modals & Accessibility toolbar
    this.bindSidebarTabs();
    this.bindAccessibilityControls();
    this.bindMobileNav();
    this.renderDirectoryList();
    this.bindForms();

    console.log("Accessible Campus Map initialized.");
  }

  /**
   * Bind sidebar navigation tabs
   */
  bindSidebarTabs() {
    const tabButtons = document.querySelectorAll(".sidebar-nav-tab");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll(".sidebar-nav-tab").forEach(btn => {
      const isSelected = btn.getAttribute("data-tab") === tabName;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    });

    // Update panel views
    document.querySelectorAll(".sidebar-panel-view").forEach(panel => {
      const isVisible = panel.getAttribute("id") === `tab-${tabName}`;
      panel.classList.toggle("active", isVisible);
    });

    // Special refresh on view switch
    if (tabName === "reports") {
      this.reports.renderReportsList("reportsListContainer", "all");
    } else if (tabName === "community") {
      this.community.renderFeed("communityFeedContainer");
    } else if (tabName === "directory") {
      this.renderDirectoryList();
    }

    // On mobile, keep sidebar open so user sees content
    const sidebar = document.getElementById("mainSidebar");
    if (sidebar && window.innerWidth < 900) {
      sidebar.classList.add("mobile-open");
    }
  }

  /**
   * Category Filter chips toggling from UI
   */
  toggleFilterChip(categoryKey) {
    this.filters.toggleChip(categoryKey);
  }

  selectAllFilters(enableAll) {
    this.filters.setAll(enableAll);
  }

  /**
   * Selecting location from search dropdown
   */
  selectLocationFromSearch(locationId) {
    this.search.closeResults();
    this.showLocationDetails(locationId);
  }

  /**
   * Selecting building from search dropdown
   */
  selectBuildingFromSearch(buildingId) {
    this.search.closeResults();
    this.showBuildingDetails(buildingId, false);
    this.navigateToCampusNavigation(buildingId);
  }

  /**
   * Show full details card for a specific building
   */
  showBuildingDetails(buildingId, openMobileSidebar = true) {
    const building = this.data.buildings.find(b => b.id === buildingId);
    if (!building) return;

    if (this.activeTab !== "explore") {
      this.switchTab("explore");
    }

    if (this.map) {
      this.map.focusBuilding(building.id);
    }

    const detailsContainer = document.getElementById("locationDetailsCard");
    if (!detailsContainer) return;

    let entrancesHtml = "";
    if (building.entrances && building.entrances.length) {
      entrancesHtml = `
        <div class="features-list-box">
          <h4><i class="fa-solid fa-door-open"></i> Building Entrances & Accessibility</h4>
          <ul class="features-list">
            ${building.entrances.map(ent => `
              <li>
                <i class="fa-solid ${ent.accessible ? 'fa-check text-success' : 'fa-triangle-exclamation text-warning'}"></i>
                <strong>${this.escapeHtml(ent.name)}:</strong> ${this.escapeHtml(ent.notes || '')}
              </li>
            `).join("")}
          </ul>
        </div>
      `;
    }

    detailsContainer.innerHTML = `
      <div class="details-card-inner">
        <div class="details-card-header">
          <div class="details-cat-tag" style="background-color: #2563eb18; color: #2563eb">
            <i class="fa-solid fa-building"></i> Academic Building
          </div>
          <button class="btn-icon-close" onclick="window.CampusApp.closeLocationDetails()" title="Close details" aria-label="Close details">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <h3 class="details-name">${this.escapeHtml(building.name)}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${this.escapeHtml(building.fullName)}</p>

        <div class="details-badges-row">
          <span class="loc-code-badge">${building.code || building.id}</span>
          <span class="loc-floor-badge"><i class="fa-solid fa-layer-group"></i> ${building.floors.length} Floors</span>
          <span class="loc-access-badge badge-step-free">
            <i class="fa-solid fa-check"></i> Step-Free Entrances
          </span>
        </div>

        <div class="details-specs-grid">
          <div class="spec-pill">
            <span class="spec-label"><i class="fa-solid fa-wheelchair"></i> Ramps</span>
            <span class="spec-value">2 Step-Free Ramps</span>
          </div>
          <div class="spec-pill">
            <span class="spec-label"><i class="fa-solid fa-elevator"></i> Elevators</span>
            <span class="spec-value">2 Lifts (Braille & Audio)</span>
          </div>
          <div class="spec-pill">
            <span class="spec-label"><i class="fa-solid fa-restroom"></i> Restrooms</span>
            <span class="spec-value">Universal Restrooms</span>
          </div>
        </div>

        ${entrancesHtml}

        <div class="details-notes-box">
          <strong><i class="fa-solid fa-circle-info"></i> About this Building:</strong>
          <p>${this.escapeHtml(building.description)}</p>
        </div>

        <div class="details-actions-bar">
          <button type="button" class="btn-primary" onclick="window.CampusApp.filters.selectFloor('L0')">
            <i class="fa-solid fa-layer-group"></i> View Ground Floor
          </button>
          <button type="button" class="btn-secondary" onclick="window.CampusApp.filters.selectFloor('L1')">
            <i class="fa-solid fa-layer-group"></i> View 1st Floor
          </button>
          <button type="button" class="btn-secondary" onclick="window.CampusApp.filters.selectFloor('L2')">
            <i class="fa-solid fa-layer-group"></i> View 2nd Floor
          </button>
          <button type="button" class="btn-secondary btn-mobile-view-map" onclick="window.CampusApp.closeMobileSidebar()">
            <i class="fa-solid fa-map-location-dot"></i> View on Map
          </button>
        </div>
      </div>
    `;

    detailsContainer.classList.add("open");

    // Scroll sidebar into view on mobile only if requested
    if (openMobileSidebar && window.innerWidth < 900) {
      const sidebar = document.getElementById("mainSidebar");
      if (sidebar) sidebar.classList.add("mobile-open");
    }
  }

  /**
   * Navigate and scroll to Campus Navigation (map) section and focus building
   */
  navigateToCampusNavigation(buildingId) {
    // 1. Ensure map is visible (close mobile drawer if covering map)
    this.closeMobileSidebar();

    // 2. Ensure map wrapper and container are displayed
    const mapSection = document.getElementById("campusNavigation") || 
                       document.querySelector(".map-container-wrapper") || 
                       document.getElementById("map");
    if (mapSection) {
      if (mapSection.style.display === "none") {
        mapSection.style.display = "";
      }
      const mapEl = document.getElementById("map");
      if (mapEl && mapEl.style.display === "none") {
        mapEl.style.display = "";
      }
      if (typeof mapSection.scrollIntoView === "function") {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // 3. Invalidate map size and focus building
    if (this.map) {
      this.map.invalidateMapSize();
      if (buildingId) {
        this.map.focusBuilding(buildingId);
      }

      // Re-invalidate and re-center after mobile drawer animation completes (250-300ms)
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateMapSize();
          if (buildingId) {
            this.map.focusBuilding(buildingId);
          }
        }
      }, 300);
    }

    const building = this.data.buildings.find(b => b.id === buildingId);
    if (building) {
      this.showToast(`Navigated to ${building.name} on map`);
    }
  }

  /**
   * Open full building details drawer on mobile or sidebar
   */
  openBuildingDetailsDrawer(buildingId) {
    this.showBuildingDetails(buildingId, true);
    if (window.innerWidth < 900) {
      const sidebar = document.getElementById("mainSidebar");
      const overlay = document.getElementById("sidebarBackdrop");
      const mobileMenuBtn = document.getElementById("mobileMenuToggle");
      if (sidebar) sidebar.classList.add("mobile-open");
      if (overlay) overlay.classList.add("show");
      if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "true");
    }
  }

  /**
   * Helper to display toast messages
   */
  showToast(message) {
    if (this.reports && typeof this.reports.showToast === "function") {
      this.reports.showToast(message);
    }
  }

  /**
   * Show full details card / modal for a specific location
   */
  showLocationDetails(locationId) {
    const loc = this.data.locations.find(l => l.id === locationId);
    if (!loc) return;

    if (this.activeTab !== "explore") {
      this.switchTab("explore");
    }

    // Switch floor on map if not matching
    if (loc.floorId !== this.map.currentFloor && loc.buildingId !== "outdoor") {
      this.filters.selectFloor(loc.floorId);
    }

    // Pan map to marker (pass false to prevent mutual recursion)
    this.map.selectLocation(loc, false);

    // Populate and show the details panel
    const detailsContainer = document.getElementById("locationDetailsCard");
    if (!detailsContainer) return;

    const cat = this.data.categories[loc.category] || {};
    const isStepFree = loc.stepFree;

    const building = (this.data && Array.isArray(this.data.buildings)) 
      ? this.data.buildings.find(b => b.id === loc.buildingId) 
      : null;

    let buildingBadgeHtml = "";
    if (loc.buildingId === "outdoor") {
      buildingBadgeHtml = `
        <span class="loc-building-badge loc-outdoor-badge">
          <i class="fa-solid fa-tree" aria-hidden="true"></i> Outdoor Campus Grounds
        </span>
      `;
    } else if (building) {
      buildingBadgeHtml = `
        <button type="button" class="loc-building-badge" 
                onclick="window.CampusApp.showBuildingDetails('${building.id}')" 
                title="View building details for ${this.escapeHtml(building.name)}" 
                aria-label="Building: ${this.escapeHtml(building.name)}. Click to view building details">
          <i class="fa-solid fa-building" aria-hidden="true"></i> ${this.escapeHtml(building.name)}
        </button>
      `;
    }

    let entranceGuidanceHtml = "";
    if (building && Array.isArray(building.entrances)) {
      const accessibleEntrances = building.entrances.filter(ent => ent.accessible === true);
      if (accessibleEntrances.length > 0) {
        entranceGuidanceHtml = `
          <div class="entrance-guidance-box">
            <h4><i class="fa-solid fa-door-open" aria-hidden="true"></i> Accessible Building Entrances (${this.escapeHtml(building.code || building.name)})</h4>
            <ul class="entrance-guidance-list">
              ${accessibleEntrances.map(ent => `
                <li>
                  <i class="fa-solid fa-wheelchair" aria-hidden="true"></i>
                  <div>
                    <strong>${this.escapeHtml(ent.name)}:</strong>
                    <span>${this.escapeHtml(ent.notes || 'Step-free access')}</span>
                  </div>
                </li>
              `).join("")}
            </ul>
          </div>
        `;
      }
    }

    let featuresHtml = "";
    if (loc.features && loc.features.length) {
      featuresHtml = `
        <div class="features-list-box">
          <h4><i class="fa-solid fa-clipboard-check"></i> Accessibility Features</h4>
          <ul class="features-list">
            ${loc.features.map(f => `<li><i class="fa-solid fa-check"></i> ${this.escapeHtml(f)}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    detailsContainer.innerHTML = `
      <div class="details-card-inner">
        <div class="details-card-header">
          <div class="details-cat-tag" style="background-color: ${cat.color}18; color: ${cat.color}">
            <i class="fa-solid ${cat.icon}"></i> ${cat.label}
          </div>
          <button class="btn-icon-close" onclick="window.CampusApp.closeLocationDetails()" title="Close details" aria-label="Close details">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <h3 class="details-name">${this.escapeHtml(loc.name)}</h3>
        <div class="details-badges-row">
          ${buildingBadgeHtml}
          <span class="loc-code-badge">${loc.code ? 'Room ' + this.escapeHtml(loc.code) : 'ID: ' + this.escapeHtml(loc.id)}</span>
          <span class="loc-floor-badge"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> ${this.escapeHtml(this.map.getFloorName(loc.floorId))}</span>
          <span class="loc-access-badge ${isStepFree ? 'badge-step-free' : 'badge-alert'}">
            <i class="fa-solid ${isStepFree ? 'fa-check' : 'fa-triangle-exclamation'}" aria-hidden="true"></i> 
            ${isStepFree ? 'Step-Free' : 'Contains Steps'}
          </span>
        </div>

        <div class="details-specs-grid">
          ${loc.doorWidthCm ? `
            <div class="spec-pill">
              <span class="spec-label"><i class="fa-solid fa-door-open"></i> Door Width</span>
              <span class="spec-value">${loc.doorWidthCm} cm</span>
            </div>
          ` : ''}
          ${loc.slopeGradient ? `
            <div class="spec-pill">
              <span class="spec-label"><i class="fa-solid fa-chart-line"></i> Ramp Slope</span>
              <span class="spec-value">${loc.slopeGradient}</span>
            </div>
          ` : ''}
          ${loc.stepCount ? `
            <div class="spec-pill spec-pill-danger">
              <span class="spec-label"><i class="fa-solid fa-stairs"></i> Steps Count</span>
              <span class="spec-value">${loc.stepCount} Steps</span>
            </div>
          ` : ''}
          ${loc.threshold ? `
            <div class="spec-pill">
              <span class="spec-label"><i class="fa-solid fa-border-all"></i> Threshold</span>
              <span class="spec-value">${loc.threshold}</span>
            </div>
          ` : ''}
          ${loc.capacityKg ? `
            <div class="spec-pill">
              <span class="spec-label"><i class="fa-solid fa-weight-scale"></i> Lift Capacity</span>
              <span class="spec-value">${loc.capacityKg} kg</span>
            </div>
          ` : ''}
        </div>

        ${entranceGuidanceHtml}

        ${featuresHtml}

        ${loc.notes ? `
          <div class="details-notes-box">
            <strong><i class="fa-solid fa-circle-info"></i> Route & Access Notes:</strong>
            <p>${this.escapeHtml(loc.notes)}</p>
          </div>
        ` : ''}

        ${loc.contact ? `
          <div class="details-contact-box">
            <small><i class="fa-solid fa-phone"></i> Contact: ${this.escapeHtml(loc.contact)}</small>
          </div>
        ` : ''}

        <div class="details-actions-bar">
          <button type="button" class="btn-primary" onclick="window.CampusApp.routeToLocation('${loc.id}')">
            <i class="fa-solid fa-diamond-turn-right"></i> Get Directions Here
          </button>
          <button type="button" class="btn-secondary btn-mobile-view-map" onclick="window.CampusApp.closeMobileSidebar()">
            <i class="fa-solid fa-map-location-dot"></i> View Location on Map
          </button>
          <button type="button" class="btn-secondary" onclick="window.CampusApp.setAsStartPoint('${loc.id}')">
            <i class="fa-solid fa-location-crosshairs"></i> Set As Start Point
          </button>
          <button type="button" class="btn-outline" onclick="window.CampusApp.openReportForLocation('${loc.id}')">
            <i class="fa-solid fa-flag"></i> Report Barrier
          </button>
        </div>
      </div>
    `;

    detailsContainer.classList.add("open");

    // Scroll sidebar into view on mobile
    if (window.innerWidth < 900) {
      const sidebar = document.getElementById("mainSidebar");
      if (sidebar) sidebar.classList.add("mobile-open");
    }
  }

  closeLocationDetails() {
    const detailsContainer = document.getElementById("locationDetailsCard");
    if (detailsContainer) {
      detailsContainer.classList.remove("open");
    }
  }

  /**
   * Directions & Routing
   */
  populateRouteDropdowns() {
    const startSelect = document.getElementById("routeStartSelect");
    const destSelect = document.getElementById("routeDestSelect");
    if (!startSelect || !destSelect) return;

    // Populate Starting Points
    let startOptions = `<optgroup label="Campus Entrances & Drop-offs">`;
    this.data.startingPoints.forEach(sp => {
      startOptions += `<option value="${sp.id}">${sp.name}</option>`;
    });
    startOptions += `</optgroup><optgroup label="Building Locations">`;
    this.data.locations.forEach(loc => {
      startOptions += `<option value="${loc.id}">${loc.name} (${loc.code || loc.floorId})</option>`;
    });
    startOptions += `</optgroup>`;
    startSelect.innerHTML = startOptions;

    // Populate Destinations
    let destOptions = `<option value="" disabled selected>Select Destination Room / Facility...</option>`;
    
    // Group by category for clarity
    const grouped = {};
    this.data.locations.forEach(loc => {
      if (!grouped[loc.category]) grouped[loc.category] = [];
      grouped[loc.category].push(loc);
    });

    Object.keys(grouped).forEach(catKey => {
      const cat = this.data.categories[catKey] || { label: catKey };
      destOptions += `<optgroup label="${cat.label}">`;
      grouped[catKey].forEach(loc => {
        destOptions += `<option value="${loc.id}">${loc.name} (${loc.code || loc.floorId})</option>`;
      });
      destOptions += `</optgroup>`;
    });

    destSelect.innerHTML = destOptions;
  }

  routeToLocation(locationId) {
    this.switchTab("routes");
    const destSelect = document.getElementById("routeDestSelect");
    if (destSelect) {
      destSelect.value = locationId;
    }
    this.calculateCurrentRoute();
  }

  setAsStartPoint(locationId) {
    this.switchTab("routes");
    const startSelect = document.getElementById("routeStartSelect");
    if (startSelect) {
      startSelect.value = locationId;
    }
    this.reports.showToast("Starting point updated.");
  }

  calculateCurrentRoute() {
    const startSelect = document.getElementById("routeStartSelect");
    const destSelect = document.getElementById("routeDestSelect");
    const stepFreeCheckbox = document.getElementById("stepFreeToggle");

    if (!startSelect || !destSelect) return;

    const startId = startSelect.value;
    const destId = destSelect.value;
    const preferStepFree = stepFreeCheckbox ? stepFreeCheckbox.checked : true;

    if (!destId) {
      alert("Please select a destination room or facility.");
      return;
    }

    const route = this.router.calculateRoute(startId, destId, preferStepFree);
    if (route) {
      this.router.renderRouteCard(route, "routeResultsPanel");
    }
  }

  clearCurrentRoute() {
    this.router.activeRoute = null;
    this.map.clearRoute();
    const container = document.getElementById("routeResultsPanel");
    if (container) container.innerHTML = "";
  }

  readRouteAloud() {
    if (this.router.activeRoute) {
      this.router.speakRoute(this.router.activeRoute);
    }
  }

  openReportForLocation(locationId) {
    const loc = this.data.locations.find(l => l.id === locationId);
    this.reports.openModal(loc);
  }

  /**
   * Campus Directory view of all rooms
   */
  renderDirectoryList() {
    const container = document.getElementById("directoryListContainer");
    if (!container) return;

    const filterFloor = document.getElementById("dirFloorFilter") ? document.getElementById("dirFloorFilter").value : "all";
    const filterCat = document.getElementById("dirCatFilter") ? document.getElementById("dirCatFilter").value : "all";

    let filtered = this.data.locations;
    if (filterFloor !== "all") {
      filtered = filtered.filter(l => l.floorId === filterFloor);
    }
    if (filterCat !== "all") {
      filtered = filtered.filter(l => l.category === filterCat);
    }

    let html = `<div class="directory-grid">`;

    filtered.forEach(loc => {
      const cat = this.data.categories[loc.category] || {};
      const isStepFree = loc.stepFree;

      html += `
        <div class="dir-item-card" onclick="window.CampusApp.showLocationDetails('${loc.id}')">
          <div class="dir-icon" style="background-color: ${cat.color}15; color: ${cat.color};">
            <i class="fa-solid ${cat.icon}"></i>
          </div>
          <div class="dir-content">
            <div class="dir-title-row">
              <span class="dir-name">${this.escapeHtml(loc.name)}</span>
              ${loc.code ? `<span class="dir-code">${loc.code}</span>` : ''}
            </div>
            <div class="dir-meta">
              <span><i class="fa-solid fa-layer-group"></i> ${this.map.getFloorName(loc.floorId)}</span>
              <span class="${isStepFree ? 'status-step-free' : 'status-stairs'}">
                <i class="fa-solid ${isStepFree ? 'fa-check' : 'fa-triangle-exclamation'}"></i> 
                ${isStepFree ? 'Step-Free' : 'Stairs'}
              </span>
            </div>
          </div>
          <button type="button" class="btn-dir-go" title="View on map" aria-label="View ${loc.name} on map">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  /**
   * Accessibility toolbar settings
   */
  bindAccessibilityControls() {
    // High contrast toggle
    const contrastBtn = document.getElementById("btnToggleContrast");
    if (contrastBtn) {
      contrastBtn.addEventListener("click", () => {
        this.isHighContrast = !this.isHighContrast;
        document.body.classList.toggle("high-contrast-mode", this.isHighContrast);
        contrastBtn.setAttribute("aria-pressed", this.isHighContrast ? "true" : "false");
        this.map.toggleHighContrast(this.isHighContrast);
      });
    }

    // Font size cycle (Normal -> Large -> Extra Large)
    const fontBtn = document.getElementById("btnCycleFontSize");
    if (fontBtn) {
      fontBtn.addEventListener("click", () => {
        if (this.currentFontSize === 1) {
          this.currentFontSize = 1.15;
          document.documentElement.style.fontSize = "18px";
          fontBtn.setAttribute("aria-label", "Font size: Large (Click for Extra Large)");
          fontBtn.querySelector(".btn-label").textContent = "Text: Large";
        } else if (this.currentFontSize === 1.15) {
          this.currentFontSize = 1.3;
          document.documentElement.style.fontSize = "20px";
          fontBtn.setAttribute("aria-label", "Font size: Extra Large (Click for Normal)");
          fontBtn.querySelector(".btn-label").textContent = "Text: XL";
        } else {
          this.currentFontSize = 1;
          document.documentElement.style.fontSize = "16px";
          fontBtn.setAttribute("aria-label", "Font size: Normal (Click for Large)");
          fontBtn.querySelector(".btn-label").textContent = "Text: Normal";
        }
      });
    }
  }

  /**
   * Mobile navigation drawer toggle & keyboard support
   */
  bindMobileNav() {
    const mobileMenuBtn = document.getElementById("mobileMenuToggle");
    const sidebar = document.getElementById("mainSidebar");
    const overlay = document.getElementById("sidebarBackdrop");
    const closeBtn = document.getElementById("sidebarCloseBtn");

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("mobile-open");
        mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (overlay) overlay.classList.toggle("show", isOpen);
        if (isOpen) {
          // Focus close button or first tab for accessibility
          if (closeBtn) closeBtn.focus();
        }
        if (this.map) this.map.invalidateMapSize();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeMobileSidebar();
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener("click", () => {
        this.closeMobileSidebar();
      });
    }

    // Keyboard Escape closes mobile drawer
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar && sidebar.classList.contains("mobile-open")) {
        this.closeMobileSidebar();
      }
    });

    // Legend toggle on mobile/desktop
    const legendBtn = document.getElementById("legendToggleBtn");
    const legendCard = document.getElementById("mapLegendCard");
    if (legendBtn && legendCard) {
      legendBtn.addEventListener("click", () => {
        const isCollapsed = legendCard.classList.toggle("is-collapsed");
        legendBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
      });
    }
  }

  /**
   * Closes mobile drawer and updates map layout
   */
  closeMobileSidebar() {
    const sidebar = document.getElementById("mainSidebar");
    const overlay = document.getElementById("sidebarBackdrop");
    const mobileMenuBtn = document.getElementById("mobileMenuToggle");

    if (sidebar) sidebar.classList.remove("mobile-open");
    if (overlay) overlay.classList.remove("show");
    if (mobileMenuBtn) {
      mobileMenuBtn.setAttribute("aria-expanded", "false");
      mobileMenuBtn.focus();
    }
    if (this.map) this.map.invalidateMapSize();
  }

  /**
   * Form event handlers
   */
  bindForms() {
    // Report Issue Form
    const reportForm = document.getElementById("reportIssueForm");
    if (reportForm) {
      reportForm.addEventListener("submit", (e) => this.reports.handleSubmit(e));
    }

    // Community Post Form
    const postForm = document.getElementById("newCommunityPostForm");
    if (postForm) {
      postForm.addEventListener("submit", (e) => this.community.handlePostSubmit(e));
    }

    // Route Calculator trigger
    const calcRouteBtn = document.getElementById("btnCalculateRoute");
    if (calcRouteBtn) {
      calcRouteBtn.addEventListener("click", () => this.calculateCurrentRoute());
    }

    // Directory filter triggers
    const dirFloor = document.getElementById("dirFloorFilter");
    const dirCat = document.getElementById("dirCatFilter");
    if (dirFloor) dirFloor.addEventListener("change", () => this.renderDirectoryList());
    if (dirCat) dirCat.addEventListener("change", () => this.renderDirectoryList());
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// Global initialization on DOM ready
if (typeof window !== "undefined") {
  window.CampusApp = new CampusApp();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.CampusApp.init();
    });
  } else {
    window.CampusApp.init();
  }
}
