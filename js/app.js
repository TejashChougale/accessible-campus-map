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

    // 7. Bind Location selection event from map
    this.map.onLocationSelected = (loc) => {
      this.showLocationDetails(loc.id);
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
   * Show full details card / modal for a specific location
   */
  showLocationDetails(locationId) {
    const loc = this.data.locations.find(l => l.id === locationId);
    if (!loc) return;

    // Switch floor on map if not matching
    if (loc.floorId !== this.map.currentFloor && loc.buildingId !== "outdoor") {
      this.filters.selectFloor(loc.floorId);
    }

    // Pan map to marker
    this.map.selectLocation(loc);

    // Populate and show the details panel
    const detailsContainer = document.getElementById("locationDetailsCard");
    if (!detailsContainer) return;

    const cat = this.data.categories[loc.category] || {};
    const isStepFree = loc.stepFree;

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
          <span class="loc-code-badge">${loc.code || 'ID: ' + loc.id}</span>
          <span class="loc-floor-badge"><i class="fa-solid fa-layer-group"></i> ${this.map.getFloorName(loc.floorId)}</span>
          <span class="loc-access-badge ${isStepFree ? 'badge-step-free' : 'badge-alert'}">
            <i class="fa-solid ${isStepFree ? 'fa-check' : 'fa-triangle-exclamation'}"></i> 
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
   * Mobile navigation drawer toggle
   */
  bindMobileNav() {
    const mobileMenuBtn = document.getElementById("mobileMenuToggle");
    const sidebar = document.getElementById("mainSidebar");
    const overlay = document.getElementById("sidebarBackdrop");

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("mobile-open");
        mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (overlay) overlay.classList.toggle("show", isOpen);
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("mobile-open");
        overlay.classList.remove("show");
        if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    }
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
