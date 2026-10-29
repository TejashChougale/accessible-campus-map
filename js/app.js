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
    this.bindQuickAssist();

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
              ${accessibleEntrances.map(ent => {
                const mappedStartId = this.getVerifiedEntranceStartPointId(ent.id);
                const hasValidMapping = mappedStartId && this.data && Array.isArray(this.data.startingPoints) && this.data.startingPoints.some(sp => sp.id === mappedStartId);
                const routeBtnHtml = hasValidMapping ? `
                  <button type="button"
                          class="btn-entrance-route"
                          onclick="window.CampusApp.routeFromEntrance('${this.escapeHtml(ent.id)}', '${this.escapeHtml(loc.id)}')"
                          title="Get step-free directions from ${this.escapeHtml(ent.name)} to ${this.escapeHtml(loc.name)}"
                          aria-label="Get step-free directions from ${this.escapeHtml(ent.name)} to ${this.escapeHtml(loc.name)}">
                    <i class="fa-solid fa-diamond-turn-right" aria-hidden="true"></i> Route from Here
                  </button>
                ` : "";

                return `
                <li class="entrance-guidance-item">
                  <div class="entrance-guidance-content">
                    <i class="fa-solid fa-wheelchair" aria-hidden="true"></i>
                    <div class="entrance-guidance-text">
                      <strong>${this.escapeHtml(ent.name)}:</strong>
                      <span>${this.escapeHtml(ent.notes || 'Step-free access')}</span>
                    </div>
                  </div>
                  ${routeBtnHtml}
                </li>
              `;
              }).join("")}
            </ul>
          </div>
        `;
      }
    }

    let nearbyAmenitiesHtml = "";
    if (this.router && typeof this.router.getNearbyAmenitiesSummary === "function" && Array.isArray(loc.coords)) {
      const nearby = this.router.getNearbyAmenitiesSummary(loc.coords, loc.floorId);
      if (nearby) {
        const items = [];
        if (nearby.washroom && nearby.washroom.amenity) {
          items.push({
            icon: "fa-restroom",
            color: "var(--cat-washrooms)",
            label: "Restroom",
            code: nearby.washroom.amenity.code || "WC",
            name: nearby.washroom.amenity.name,
            dist: nearby.washroom.distanceMeters,
            isSame: nearby.washroom.isSameFloor,
            floorName: this.map.getFloorName(nearby.washroom.amenity.floorId),
            targetId: nearby.washroom.amenity.id
          });
        }
        if (nearby.lift && nearby.lift.amenity) {
          items.push({
            icon: "fa-elevator",
            color: "var(--cat-lifts)",
            label: "Lift",
            code: nearby.lift.amenity.code || "Lift",
            name: nearby.lift.amenity.name,
            dist: nearby.lift.distanceMeters,
            isSame: nearby.lift.isSameFloor,
            floorName: this.map.getFloorName(nearby.lift.amenity.floorId),
            targetId: nearby.lift.amenity.id
          });
        }
        if (nearby.water && nearby.water.amenity) {
          items.push({
            icon: "fa-faucet-drip",
            color: "var(--cat-water)",
            label: "Water",
            code: nearby.water.amenity.code || "Water",
            name: nearby.water.amenity.name,
            dist: nearby.water.distanceMeters,
            isSame: nearby.water.isSameFloor,
            floorName: this.map.getFloorName(nearby.water.amenity.floorId),
            targetId: nearby.water.amenity.id
          });
        }

        if (items.length > 0) {
          nearbyAmenitiesHtml = `
            <div class="nearby-amenities-card" role="region" aria-label="Nearby Accessible Amenities">
              <div class="nearby-amenities-header">
                <h4><i class="fa-solid fa-person-walking-arrow-right" aria-hidden="true"></i> Nearby Accessible Amenities</h4>
                <small class="text-muted">From this room</small>
              </div>
              <div class="nearby-amenities-list">
                ${items.map(item => `
                  <div class="nearby-amenity-item">
                    <div class="nearby-amenity-icon" style="color: ${item.color};">
                      <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
                    </div>
                    <div class="nearby-amenity-info">
                      <div class="nearby-amenity-title">
                        <strong>${this.escapeHtml(item.label)} (${this.escapeHtml(item.code)})</strong>
                        <span class="nearby-dist-badge ${item.isSame ? 'badge-same-floor' : 'badge-diff-floor'}">
                          ${item.dist}m · ${item.isSame ? 'Same floor' : this.escapeHtml(item.floorName)}
                        </span>
                      </div>
                      <small class="nearby-amenity-name">${this.escapeHtml(item.name)}</small>
                    </div>
                    <button type="button" class="btn-sm btn-primary nearby-route-btn"
                            onclick="window.CampusApp.routeFromTo('${loc.id}', '${item.targetId}')"
                            title="Navigate to ${this.escapeHtml(item.label)}"
                            aria-label="Route to ${this.escapeHtml(item.label)} ${this.escapeHtml(item.code)}">
                      <i class="fa-solid fa-diamond-turn-right" aria-hidden="true"></i> Route
                    </button>
                  </div>
                `).join("")}
              </div>
            </div>
          `;
        }
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

        ${nearbyAmenitiesHtml}

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
    this.updateQuickAssistReference(loc.name);

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
    this.updateQuickAssistReference();
  }

  /**
   * Day 4 Quick Assist: Nearest Accessible Amenity Methods
   */
  bindQuickAssist() {
    const buttons = document.querySelectorAll(".btn-quick-assist");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const catKey = btn.getAttribute("data-quick-cat");
        if (catKey) {
          this.handleQuickAssist(catKey);
        }
      });
    });
  }

  updateQuickAssistReference(customText = null) {
    const refTextEl = document.getElementById("quickAssistReferenceText");
    if (!refTextEl) return;

    if (customText) {
      refTextEl.textContent = `From: ${customText}`;
      return;
    }

    if (this.map && this.map.selectedLocation) {
      const loc = this.map.selectedLocation;
      refTextEl.textContent = `From: ${loc.name || loc.code || 'Selected Location'}`;
    } else if (this.map) {
      refTextEl.textContent = `From: ${this.map.getFloorName(this.map.currentFloor)}`;
    }
  }

  handleQuickAssist(categoryKey) {
    if (!this.router) return;

    let originCoords = null;
    let originFloorId = this.map ? this.map.currentFloor : "L0";
    let originName = this.map ? this.map.getFloorName(originFloorId) : "Ground Floor";
    let originLocationId = null;

    if (this.map && this.map.selectedLocation && Array.isArray(this.map.selectedLocation.coords)) {
      originCoords = this.map.selectedLocation.coords;
      originFloorId = this.map.selectedLocation.floorId || originFloorId;
      originName = this.map.selectedLocation.name || originName;
      originLocationId = this.map.selectedLocation.id;
    } else {
      originCoords = (this.data && this.data.campusCenter) ? this.data.campusCenter : [12.93485, 77.53530];
      if (originFloorId === "L0" && this.data && Array.isArray(this.data.startingPoints) && this.data.startingPoints[0]) {
        originLocationId = this.data.startingPoints[0].id;
        originName = this.data.startingPoints[0].name;
      }
    }

    const result = this.router.findNearestAmenity(originCoords, originFloorId, categoryKey);

    if (!result || !result.amenity) {
      this.showToast(`No accessible facility found for "${categoryKey}".`);
      return;
    }

    const targetLoc = result.amenity;
    const isSameFloor = result.isSameFloor;
    const floorLabel = this.map ? this.map.getFloorName(targetLoc.floorId) : targetLoc.floorId;

    // Switch floor if amenity is on another floor
    if (this.filters && this.map && this.map.currentFloor !== targetLoc.floorId) {
      this.filters.selectFloor(targetLoc.floorId);
    }

    // Select marker on map
    if (this.map) {
      this.map.selectLocation(targetLoc, false);
    }

    // Update screen reader live announcer
    const announcer = document.getElementById("a11yAnnouncer");
    if (announcer) {
      announcer.textContent = `Nearest accessible ${categoryKey} is ${targetLoc.name}, ${result.distanceMeters} meters away on ${floorLabel}.`;
    }

    this.showToast(`Nearest ${targetLoc.name}: ${result.distanceMeters}m away (${isSameFloor ? 'Same floor' : floorLabel})`);

    // Switch to Routes tab and automatically calculate route
    this.switchTab("routes");

    const startSelect = document.getElementById("routeStartSelect");
    const destSelect = document.getElementById("routeDestSelect");

    if (destSelect) {
      destSelect.value = targetLoc.id;
    }

    if (startSelect) {
      if (originLocationId && Array.from(startSelect.options).some(o => o.value === originLocationId)) {
        startSelect.value = originLocationId;
      } else if (originFloorId === "L0" && Array.from(startSelect.options).some(o => o.value === "SP-GATE")) {
        startSelect.value = "SP-GATE";
      } else if (Array.from(startSelect.options).some(o => o.value === "SP-ATRIUM")) {
        startSelect.value = "SP-ATRIUM";
      }
    }

    this.calculateCurrentRoute();
  }

  routeFromTo(fromId, toId) {
    this.switchTab("routes");
    const startSelect = document.getElementById("routeStartSelect");
    const destSelect = document.getElementById("routeDestSelect");
    if (startSelect) startSelect.value = fromId;
    if (destSelect) destSelect.value = toId;
    this.calculateCurrentRoute();
  }

  /**
   * Verified mapping of building entrances to campus route starting points.
   * Only returns an ID if explicitly mapped and present in this.data.startingPoints.
   */
  getVerifiedEntranceStartPointId(entranceId) {
    if (!entranceId || typeof entranceId !== "string") return null;

    const verifiedMap = {
      "ent-north": "SP-NORTH-RAMP",
      "ent-east": "SP-PARK"
    };

    const startId = verifiedMap[entranceId];
    if (startId && this.data && Array.isArray(this.data.startingPoints)) {
      const exists = this.data.startingPoints.some(sp => sp.id === startId);
      if (exists) return startId;
    }
    return null;
  }

  /**
   * Day 4 Feature: "Route from Here" - Computes step-free route from a verified
   * building entrance starting point directly to the destination location.
   */
  routeFromEntrance(entranceId, targetLocationId) {
    const startPointId = this.getVerifiedEntranceStartPointId(entranceId);
    if (!startPointId) {
      console.error(`Unverified entrance ID: "${entranceId}"`);
      if (this.reports && typeof this.reports.showToast === "function") {
        this.reports.showToast("Selected entrance does not have an active starting point.");
      }
      return;
    }

    const startPoint = (this.data && Array.isArray(this.data.startingPoints))
      ? this.data.startingPoints.find(sp => sp.id === startPointId)
      : null;
    const targetLoc = (this.data && Array.isArray(this.data.locations))
      ? this.data.locations.find(l => l.id === targetLocationId)
      : null;

    if (!targetLoc) {
      console.error(`Target location ID: "${targetLocationId}" not found.`);
      if (this.reports && typeof this.reports.showToast === "function") {
        this.reports.showToast("Destination room or facility not found.");
      }
      return;
    }

    const startName = startPoint ? startPoint.name : startPointId;
    const destName = targetLoc.name || targetLoc.code || "destination";

    // Announce calculation start without falsely claiming success before calculation finishes
    const announcer = document.getElementById("a11yAnnouncer");
    if (announcer) {
      announcer.textContent = `Calculating step-free directions from ${startName} to ${destName}...`;
    }

    // Switch to Routes view
    this.switchTab("routes");

    // Ensure dropdowns are synced with selected endpoints
    const startSelect = document.getElementById("routeStartSelect");
    const destSelect = document.getElementById("routeDestSelect");

    if (startSelect) {
      startSelect.value = startPointId;
    }
    if (destSelect) {
      destSelect.value = targetLoc.id;
    }

    // Calculate route using existing routing pipeline
    this.calculateCurrentRoute();

    // Verify actual outcome after calculation
    if (this.router && this.router.activeRoute) {
      const route = this.router.activeRoute;
      if (announcer) {
        announcer.textContent = `Route ready from ${startName} to ${destName}. Total distance ${route.totalDistanceMeters} meters, estimated travel time ${route.totalEstMinutes} minute${route.totalEstMinutes !== 1 ? 's' : ''}.`;
      }
      if (this.reports && typeof this.reports.showToast === "function") {
        this.reports.showToast(`Route calculated from ${startName}`);
      }
    } else {
      if (announcer) {
        announcer.textContent = `Unable to calculate route from ${startName} to ${destName}.`;
      }
      if (this.reports && typeof this.reports.showToast === "function") {
        this.reports.showToast("Unable to calculate route. Please try another starting point.");
      }
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
