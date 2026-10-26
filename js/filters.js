/**
 * ACCESSIBLE CAMPUS MAP - FILTER & FLOOR CONTROLLER
 * 
 * Manages category filters (ramps, lifts, washrooms, water, stairs, etc.)
 * and floor selection (Ground Floor, 1st Floor, 2nd Floor) with dynamic counts.
 */

class CampusFilters {
  constructor(data, mapController) {
    this.data = data;
    this.mapController = mapController;
    this.filtersContainer = null;
    this.floorButtons = [];
  }

  init(filtersContainerId = "categoryFiltersGroup", floorSelectorId = "floorSwitcherGroup") {
    this.filtersContainer = document.getElementById(filtersContainerId);
    this.floorSelector = document.getElementById(floorSelectorId);

    this.renderCategoryFilters();
    this.bindFloorButtons();
  }

  /**
   * Renders dynamic filter chips with live counts for current floor
   */
  renderCategoryFilters() {
    if (!this.filtersContainer) return;

    const categories = this.data.categories;
    const currentFloor = this.mapController.currentFloor;

    // Calculate count of points per category on this floor
    const counts = {};
    Object.keys(categories).forEach(catKey => counts[catKey] = 0);

    this.data.locations.forEach(loc => {
      const matchFloor = (loc.floorId === currentFloor) || 
                         (loc.buildingId === "outdoor" && currentFloor === "L0");
      if (matchFloor && counts[loc.category] !== undefined) {
        counts[loc.category]++;
      }
    });

    let html = `
      <div class="filter-actions-bar">
        <span class="filter-heading"><i class="fa-solid fa-filter"></i> Filter Facilities</span>
        <div class="filter-quick-toggles">
          <button type="button" class="btn-text-action" id="filterSelectAllBtn" onclick="window.CampusApp.selectAllFilters(true)">All</button>
          <span class="divider">|</span>
          <button type="button" class="btn-text-action" id="filterClearAllBtn" onclick="window.CampusApp.selectAllFilters(false)">Clear</button>
        </div>
      </div>
      <div class="filter-chips-grid">
    `;

    Object.keys(categories).forEach(catKey => {
      const cat = categories[catKey];
      const count = counts[catKey] || 0;
      const isActive = this.mapController.activeFilters.has(catKey);

      html += `
        <button type="button" 
                class="filter-chip ${isActive ? 'active' : ''} ${catKey === 'stairs' ? 'chip-danger' : ''}" 
                data-category="${catKey}"
                aria-pressed="${isActive ? 'true' : 'false'}"
                onclick="window.CampusApp.toggleFilterChip('${catKey}')">
          <span class="chip-icon" style="background-color: ${cat.color}20; color: ${cat.color};">
            <i class="fa-solid ${cat.icon}"></i>
          </span>
          <span class="chip-label">${cat.label}</span>
          <span class="chip-count">${count}</span>
        </button>
      `;
    });

    html += `</div>`;
    this.filtersContainer.innerHTML = html;
  }

  /**
   * Setup floor switcher buttons
   */
  bindFloorButtons() {
    if (!this.floorSelector) return;

    const buttons = this.floorSelector.querySelectorAll("[data-floor]");
    this.floorButtons = Array.from(buttons);

    this.floorButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const floorId = btn.getAttribute("data-floor");
        this.selectFloor(floorId);
      });
    });
  }

  /**
   * Switch floor in UI and on map
   */
  selectFloor(floorId) {
    this.floorButtons.forEach(btn => {
      const isCurrent = btn.getAttribute("data-floor") === floorId;
      btn.classList.toggle("active", isCurrent);
      btn.setAttribute("aria-selected", isCurrent ? "true" : "false");
    });

    // Update map
    this.mapController.switchFloor(floorId);

    // Re-render category filters to update dynamic location counts
    this.renderCategoryFilters();

    // Announce floor switch for accessibility screen readers
    const announcer = document.getElementById("a11yAnnouncer");
    if (announcer) {
      announcer.textContent = `Viewing ${this.mapController.getFloorName(floorId)}`;
    }
  }

  /**
   * Toggle single category chip
   */
  toggleChip(categoryKey) {
    const isCurrentlyActive = this.mapController.activeFilters.has(categoryKey);
    const newState = !isCurrentlyActive;

    this.mapController.toggleCategory(categoryKey, newState);

    const chip = this.filtersContainer.querySelector(`[data-category="${categoryKey}"]`);
    if (chip) {
      chip.classList.toggle("active", newState);
      chip.setAttribute("aria-pressed", newState ? "true" : "false");
    }
  }

  /**
   * Set all filters on or off
   */
  setAll(enableAll) {
    this.mapController.setAllFilters(enableAll);
    const chips = this.filtersContainer.querySelectorAll(".filter-chip");
    chips.forEach(chip => {
      chip.classList.toggle("active", enableAll);
      chip.setAttribute("aria-pressed", enableAll ? "true" : "false");
    });
  }
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.CampusFilters = CampusFilters;
}
