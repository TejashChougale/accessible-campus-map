/**
 * ACCESSIBLE CAMPUS MAP - SEARCH ENGINE & AUTOCOMPLETE
 * 
 * Supports fast searching by:
 * - Building name, code, full title (e.g. "Main Academic Block", "MAB", "Engineering")
 * - Room number (e.g. "101", "201", "302")
 * - Name / Title (e.g. "Data Structures Lab", "Seminar Hall", "HOD Cabin")
 * - Category keyword (e.g. "washroom", "lift", "elevator", "ramp", "water", "stair")
 * - Accessibility tags (e.g. "braille", "hearing loop", "evac", "wide door", "step-free")
 */

class CampusSearch {
  constructor(data, mapController) {
    this.data = data;
    this.mapController = mapController;
    this.searchInput = null;
    this.resultsContainer = null;
    this.searchBtn = null;
    this.clearBtn = null;
    this.activeSuggestionIndex = -1;
    this.debounceTimer = null;
  }

  init(inputId = "campusSearchInput", resultsId = "searchResultsDropdown") {
    this.searchInput = document.getElementById(inputId);
    this.resultsContainer = document.getElementById(resultsId);
    this.searchBtn = document.getElementById("searchSubmitBtn");
    this.clearBtn = document.getElementById("searchClearBtn");

    if (!this.searchInput || !this.resultsContainer) {
      console.warn("Search elements not found.");
      return;
    }

    // Input event for instant dynamic search with 150ms debounce
    this.searchInput.addEventListener("input", (e) => {
      this.handleInput(e.target.value.trim());
    });

    // Keyboard navigation in search input and dropdown
    this.searchInput.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });

    // Focus on input re-opens dropdown if there is a query
    this.searchInput.addEventListener("focus", () => {
      const q = this.searchInput.value.trim();
      if (q.length > 0 && !this.resultsContainer.classList.contains("open")) {
        const matches = this.query(q);
        this.renderResults(matches, q);
      }
    });

    // Search button click handler
    if (this.searchBtn) {
      this.searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.submitSearch();
      });
    }

    // Clear button click handler
    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.clearSearch();
      });
    }

    // Close dropdown on click outside
    document.addEventListener("click", (e) => {
      if (!this.searchInput.contains(e.target) && 
          !this.resultsContainer.contains(e.target) &&
          (!this.searchBtn || !this.searchBtn.contains(e.target)) &&
          (!this.clearBtn || !this.clearBtn.contains(e.target))) {
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

    // Toggle clear button
    if (this.clearBtn) {
      this.clearBtn.style.display = query.length > 0 ? "flex" : "none";
    }

    if (!query || query.length < 1) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.closeResults();
      return;
    }

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const matches = this.query(query);
      this.renderResults(matches, query);
    }, 150);
  }

  /**
   * Comprehensive search across Buildings and Locations
   */
  query(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const results = [];

    // 1. Search Buildings
    if (this.data && Array.isArray(this.data.buildings)) {
      this.data.buildings.forEach(b => {
        const nameMatch = b.name && b.name.toLowerCase().includes(q);
        const fullNameMatch = b.fullName && b.fullName.toLowerCase().includes(q);
        const codeMatch = b.code && b.code.toLowerCase().includes(q);
        const idMatch = b.id && b.id.toLowerCase().includes(q);
        const descMatch = b.description && b.description.toLowerCase().includes(q);
        
        let entranceMatch = false;
        if (b.entrances && Array.isArray(b.entrances)) {
          entranceMatch = b.entrances.some(ent => 
            (ent.name && ent.name.toLowerCase().includes(q)) || 
            (ent.notes && ent.notes.toLowerCase().includes(q))
          );
        }

        if (nameMatch || fullNameMatch || codeMatch || idMatch || descMatch || entranceMatch) {
          let score = 10;
          if (codeMatch && b.code.toLowerCase() === q) score += 60;
          if (nameMatch && b.name.toLowerCase().startsWith(q)) score += 40;
          if (nameMatch && b.name.toLowerCase().includes(q)) score += 25;
          if (fullNameMatch && b.fullName.toLowerCase().includes(q)) score += 20;

          results.push({
            type: "building",
            score: score,
            data: b
          });
        }
      });
    }

    // 2. Search Locations (Classrooms, Labs, Restrooms, Ramps, Lifts, etc.)
    if (this.data && Array.isArray(this.data.locations)) {
      this.data.locations.forEach(loc => {
        const cat = (this.data.categories && this.data.categories[loc.category]) || {};
        const catLabel = cat.label || "";
        
        const codeMatch = loc.code && loc.code.toLowerCase().includes(q);
        const nameMatch = loc.name && loc.name.toLowerCase().includes(q);
        const catMatch = (loc.category && loc.category.toLowerCase().includes(q)) ||
                         (catLabel && catLabel.toLowerCase().includes(q));
        const notesMatch = loc.notes && loc.notes.toLowerCase().includes(q);
        const featureMatch = loc.features && loc.features.some(f => f.toLowerCase().includes(q));
        
        // Match building context
        let buildingMatch = false;
        if (this.data.buildings) {
          const b = this.data.buildings.find(item => item.id === loc.buildingId);
          if (b) {
            buildingMatch = (b.name && b.name.toLowerCase().includes(q)) ||
                            (b.code && b.code.toLowerCase() === q);
          }
        }

        if (codeMatch || nameMatch || catMatch || notesMatch || featureMatch || buildingMatch) {
          let score = 5;
          if (codeMatch && loc.code.toLowerCase() === q) score += 50;
          if (codeMatch && loc.code.toLowerCase().startsWith(q)) score += 25;
          if (nameMatch && loc.name.toLowerCase().startsWith(q)) score += 20;
          if (nameMatch && loc.name.toLowerCase().includes(q)) score += 10;
          if (catMatch) score += 15;

          results.push({
            type: "location",
            score: score,
            data: loc
          });
        }
      });
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Backwards-compatible wrapper returning array of raw location/building objects
   */
  queryLocations(query) {
    return this.query(query).map(r => r.data);
  }

  renderResults(results, query) {
    if (!results || results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-empty-state">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <p>No accessible rooms, buildings, or facilities found matching "<strong>${this.escapeHtml(query)}</strong>"</p>
          <small>Try searching "Main Academic Block", "101", "Lab", "Lift", "Ramp", or "Washroom"</small>
        </div>
      `;
      this.resultsContainer.classList.add("open");
      return;
    }

    let html = `<div class="search-results-list" role="listbox" aria-label="Search suggestions">`;

    results.slice(0, 8).forEach((item, index) => {
      if (item.type === "building") {
        const b = item.data;
        const floorCount = b.floors ? b.floors.length : 3;

        html += `
          <div class="search-result-item search-result-building" 
               role="option" 
               id="search-opt-${index}"
               tabindex="0"
               data-type="building"
               data-id="${b.id}"
               onclick="window.CampusApp.selectBuildingFromSearch('${b.id}')">
            <div class="result-icon-box" style="background-color: #2563eb18; color: #2563eb">
              <i class="fa-solid fa-building" aria-hidden="true"></i>
            </div>
            <div class="result-info">
              <div class="result-title-row">
                <span class="result-name">${this.highlightMatch(b.name, query)}</span>
                <span class="result-code result-building-badge">${b.code}</span>
              </div>
              <div class="result-details">
                <span><i class="fa-solid fa-layer-group" aria-hidden="true"></i> ${floorCount} Floors (Ground, 1F, 2F)</span>
                <span class="status-step-free">
                  <i class="fa-solid fa-check" aria-hidden="true"></i> Step-Free Entrances
                </span>
              </div>
            </div>
            <div class="result-arrow">
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </div>
          </div>
        `;
      } else {
        const loc = item.data;
        const cat = (this.data.categories && this.data.categories[loc.category]) || {};
        const isStepFree = loc.stepFree;
        const floorName = this.mapController ? this.mapController.getFloorName(loc.floorId) : loc.floorId;

        let buildingTagHtml = "";
        if (loc.buildingId === "outdoor") {
          buildingTagHtml = `<span class="result-building-tag result-outdoor-tag"><i class="fa-solid fa-tree" aria-hidden="true"></i> Outdoor Grounds</span>`;
        } else if (this.data && Array.isArray(this.data.buildings)) {
          const b = this.data.buildings.find(item => item.id === loc.buildingId);
          if (b) {
            const bText = (b.name && b.code && !b.name.includes(b.code)) ? `${b.name} (${b.code})` : (b.name || b.code || "");
            buildingTagHtml = `<span class="result-building-tag"><i class="fa-solid fa-building" aria-hidden="true"></i> ${this.escapeHtml(bText)}</span>`;
          }
        }

        html += `
          <div class="search-result-item" 
               role="option" 
               id="search-opt-${index}"
               tabindex="0"
               data-type="location"
               data-id="${loc.id}"
               data-floor="${loc.floorId}"
               onclick="window.CampusApp.selectLocationFromSearch('${loc.id}')">
            <div class="result-icon-box" style="background-color: ${cat.color || '#2563eb'}18; color: ${cat.color || '#2563eb'}">
              <i class="fa-solid ${cat.icon || 'fa-location-dot'}" aria-hidden="true"></i>
            </div>
            <div class="result-info">
              <div class="result-title-row">
                <span class="result-name">${this.highlightMatch(loc.name, query)}</span>
                ${loc.code ? `<span class="result-code">${loc.code}</span>` : ''}
              </div>
              <div class="result-details">
                ${buildingTagHtml}
                <span><i class="fa-solid fa-layer-group" aria-hidden="true"></i> ${floorName}</span>
                <span class="${isStepFree ? 'status-step-free' : 'status-stairs'}">
                  <i class="fa-solid ${isStepFree ? 'fa-check' : 'fa-triangle-exclamation'}" aria-hidden="true"></i> 
                  ${isStepFree ? 'Step-Free' : 'Stairs Alert'}
                </span>
              </div>
            </div>
            <div class="result-arrow">
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </div>
          </div>
        `;
      }
    });

    html += `</div>`;
    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.add("open");
  }

  /**
   * Submit search immediately (triggered by Enter key or Search button click)
   */
  submitSearch(explicitQuery) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    const query = (explicitQuery !== undefined ? explicitQuery : (this.searchInput ? this.searchInput.value : "")).trim();

    if (!query) {
      this.closeResults();
      if (this.searchInput) this.searchInput.focus();
      return;
    }

    const matches = this.query(query);

    if (matches.length === 0) {
      this.renderResults([], query);
      return;
    }

    // Determine target match to select
    const targetIndex = (this.activeSuggestionIndex >= 0 && this.activeSuggestionIndex < matches.length)
      ? this.activeSuggestionIndex
      : 0;

    const chosen = matches[targetIndex];
    this.closeResults();

    if (chosen.type === "building") {
      if (window.CampusApp && typeof window.CampusApp.selectBuildingFromSearch === "function") {
        window.CampusApp.selectBuildingFromSearch(chosen.data.id);
      }
    } else {
      if (window.CampusApp && typeof window.CampusApp.selectLocationFromSearch === "function") {
        window.CampusApp.selectLocationFromSearch(chosen.data.id);
      }
    }
  }

  handleKeydown(e) {
    const items = this.resultsContainer ? this.resultsContainer.querySelectorAll(".search-result-item") : [];

    if (e.key === "Enter") {
      e.preventDefault();
      if (this.activeSuggestionIndex >= 0 && items.length > this.activeSuggestionIndex) {
        items[this.activeSuggestionIndex].click();
      } else {
        this.submitSearch(this.searchInput ? this.searchInput.value : "");
      }
      return;
    }

    if (e.key === "Escape") {
      this.closeResults();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      // If dropdown is closed, open it with current query
      if (!this.resultsContainer.classList.contains("open")) {
        const q = (this.searchInput ? this.searchInput.value : "").trim();
        if (q.length > 0) {
          const matches = this.query(q);
          this.renderResults(matches, q);
        }
        return;
      }
      if (!items.length) return;
      this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % items.length;
      this.updateActiveItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + items.length) % items.length;
      this.updateActiveItem(items);
    }
  }

  updateActiveItem(items) {
    items.forEach((item, index) => {
      if (index === this.activeSuggestionIndex) {
        item.classList.add("active");
        item.setAttribute("aria-selected", "true");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      }
    });
  }

  clearSearch() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.searchInput) {
      this.searchInput.value = "";
      this.searchInput.focus();
    }
    if (this.clearBtn) {
      this.clearBtn.style.display = "none";
    }
    this.closeResults();
  }

  closeResults() {
    if (this.resultsContainer) {
      this.resultsContainer.classList.remove("open");
      this.resultsContainer.innerHTML = "";
    }
    this.activeSuggestionIndex = -1;
  }

  highlightMatch(text, query) {
    if (!text || !query) return text || "";
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.CampusSearch = CampusSearch;
}
