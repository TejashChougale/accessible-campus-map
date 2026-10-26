/**
 * ACCESSIBLE CAMPUS MAP - SEARCH ENGINE & AUTOCOMPLETE
 * 
 * Supports fast searching by:
 * - Room number (e.g. "101", "201", "302")
 * - Name / Title (e.g. "Data Structures Lab", "Seminar Hall", "HOD Cabin")
 * - Category keyword (e.g. "washroom", "lift", "ramp", "water", "stair")
 * - Accessibility tags (e.g. "braille", "hearing loop", "evac", "wide door")
 */

class CampusSearch {
  constructor(data, mapController) {
    this.data = data;
    this.mapController = mapController;
    this.searchInput = null;
    this.resultsContainer = null;
    this.activeSuggestionIndex = -1;
  }

  init(inputId = "campusSearchInput", resultsId = "searchResultsDropdown") {
    this.searchInput = document.getElementById(inputId);
    this.resultsContainer = document.getElementById(resultsId);

    if (!this.searchInput || !this.resultsContainer) {
      console.warn("Search elements not found.");
      return;
    }

    // Input event for instant dynamic search
    this.searchInput.addEventListener("input", (e) => {
      this.handleInput(e.target.value.trim());
    });

    // Keyboard navigation in search dropdown
    this.searchInput.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });

    // Close dropdown on click outside
    document.addEventListener("click", (e) => {
      if (!this.searchInput.contains(e.target) && !this.resultsContainer.contains(e.target)) {
        this.closeResults();
      }
    });

    // Global keyboard shortcut: '/' or 'Ctrl+K'
    document.addEventListener("keydown", (e) => {
      if ((e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") ||
          (e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      }
    });
  }

  handleInput(query) {
    this.activeSuggestionIndex = -1;

    if (!query || query.length < 1) {
      this.closeResults();
      return;
    }

    const matches = this.queryLocations(query);
    this.renderResults(matches, query);
  }

  queryLocations(query) {
    const q = query.toLowerCase();

    return this.data.locations.filter(loc => {
      const codeMatch = loc.code && loc.code.toLowerCase().includes(q);
      const nameMatch = loc.name && loc.name.toLowerCase().includes(q);
      const categoryMatch = loc.category && loc.category.toLowerCase().includes(q);
      const notesMatch = loc.notes && loc.notes.toLowerCase().includes(q);
      
      const featureMatch = loc.features && loc.features.some(f => f.toLowerCase().includes(q));

      return codeMatch || nameMatch || categoryMatch || notesMatch || featureMatch;
    });
  }

  renderResults(results, query) {
    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-empty-state">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>No accessible rooms or facilities found matching "<strong>${this.escapeHtml(query)}</strong>"</p>
          <small>Try searching "101", "Lab", "Lift", "Ramp", "Washroom", or "Library"</small>
        </div>
      `;
      this.resultsContainer.classList.add("open");
      return;
    }

    let html = `<div class="search-results-list" role="listbox" aria-label="Search suggestions">`;

    results.slice(0, 8).forEach((loc, index) => {
      const cat = this.data.categories[loc.category] || {};
      const isStepFree = loc.stepFree;

      html += `
        <div class="search-result-item" 
             role="option" 
             id="search-opt-${index}"
             tabindex="0"
             data-id="${loc.id}"
             data-floor="${loc.floorId}"
             onclick="window.CampusApp.selectLocationFromSearch('${loc.id}')">
          <div class="result-icon-box" style="background-color: ${cat.color}15; color: ${cat.color}">
            <i class="fa-solid ${cat.icon}"></i>
          </div>
          <div class="result-info">
            <div class="result-title-row">
              <span class="result-name">${this.highlightMatch(loc.name, query)}</span>
              ${loc.code ? `<span class="result-code">${loc.code}</span>` : ''}
            </div>
            <div class="result-details">
              <span><i class="fa-solid fa-layer-group"></i> ${this.mapController.getFloorName(loc.floorId)}</span>
              <span class="${isStepFree ? 'status-step-free' : 'status-stairs'}">
                <i class="fa-solid ${isStepFree ? 'fa-check' : 'fa-triangle-exclamation'}"></i> 
                ${isStepFree ? 'Step-Free' : 'Stairs Alert'}
              </span>
            </div>
          </div>
          <div class="result-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.add("open");
  }

  handleKeydown(e) {
    const items = this.resultsContainer.querySelectorAll(".search-result-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % items.length;
      this.updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + items.length) % items.length;
      this.updateActiveItem(items);
    } else if (e.key === "Enter" && this.activeSuggestionIndex >= 0) {
      e.preventDefault();
      items[this.activeSuggestionIndex].click();
    } else if (e.key === "Escape") {
      this.closeResults();
    }
  }

  updateActiveItem(items) {
    items.forEach((item, index) => {
      if (index === this.activeSuggestionIndex) {
        item.classList.add("active");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
      }
    });
  }

  closeResults() {
    this.resultsContainer.classList.remove("open");
    this.resultsContainer.innerHTML = "";
    this.activeSuggestionIndex = -1;
  }

  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.CampusSearch = CampusSearch;
}
