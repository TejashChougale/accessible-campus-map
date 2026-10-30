/**
 * ACCESSIBLE CAMPUS MAP - ROUTE PLANNER & ACCESSIBLE PATHFINDER
 * 
 * Computes step-free, wheelchair-friendly navigation paths
 * between campus starting points and destination rooms/facilities.
 * Generates turn-by-turn guidance, elevator transfer instructions,
 * distance, transit time, and route accessibility audits.
 */

class CampusRouter {
  constructor(data, mapController) {
    this.data = data;
    this.mapController = mapController;
    this.activeRoute = null;
    this.speechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
  }

  /**
   * Calculates an accessible route from startId to targetId
   */
  calculateRoute(startId, targetId, preferStepFree = true) {
    const targetLoc = this.data.locations.find(l => l.id === targetId);
    if (!targetLoc) {
      console.error(`Target location ${targetId} not found.`);
      return null;
    }

    // Resolve starting point
    let startPoint = this.data.startingPoints.find(sp => sp.id === startId);
    let startCoords, startName, startFloor;

    if (startPoint) {
      startCoords = startPoint.coords;
      startName = startPoint.name;
      startFloor = startPoint.floorId || "L0";
    } else {
      // Could be another location ID
      const startLoc = this.data.locations.find(l => l.id === startId);
      if (startLoc) {
        startCoords = startLoc.coords;
        startName = startLoc.name;
        startFloor = startLoc.floorId || "L0";
      } else {
        // Fallback default: Campus Main Gate
        startPoint = this.data.startingPoints[0];
        startCoords = startPoint.coords;
        startName = startPoint.name;
        startFloor = startPoint.floorId || "L0";
      }
    }

    // Validation 1: Same start and destination
    if (startId === targetId) {
      const sameLocationResult = {
        isSameLocation: true,
        startId,
        startName: targetLoc.name,
        targetId,
        targetLocation: targetLoc,
        waypoints: [targetLoc.coords],
        steps: [
          {
            stepNumber: 1,
            type: "arrive",
            icon: "fa-location-dot",
            instruction: `You are already at ${targetLoc.name}.`,
            notes: "Start location and destination are the same. No transit is required.",
            distance: 0
          }
        ],
        totalDistanceMeters: 0,
        totalEstMinutes: 0,
        isStepFree: true,
        hasElevator: false,
        warningNotes: []
      };
      this.activeRoute = sameLocationResult;
      return sameLocationResult;
    }

    // Validation 2: No step-free route available when user prefers step-free
    if (preferStepFree && targetLoc.stepFree === false) {
      const noStepFreeResult = {
        noStepFreeRoute: true,
        startId,
        startName: startName || "Selected Origin",
        targetId,
        targetLocation: targetLoc,
        waypoints: [],
        steps: [],
        totalDistanceMeters: 0,
        totalEstMinutes: 0,
        isStepFree: false,
        hasElevator: false,
        warningNotes: [`No 100% step-free route is available to ${targetLoc.name}. This destination requires navigating stairs or stepped thresholds.`]
      };
      this.activeRoute = noStepFreeResult;
      return noStepFreeResult;
    }

    // Waypoints array for map polyline
    const waypoints = [];
    waypoints.push(startCoords);

    // Turn-by-turn steps
    const steps = [];
    let totalDistanceMeters = 0;

    // Step 1: Start at Origin
    steps.push({
      stepNumber: 1,
      type: "start",
      icon: "fa-location-dot",
      instruction: `Start at ${startName}.`,
      notes: "Follow the tactile guidance path with yellow ground strips.",
      distance: 0
    });

    // Handle outdoor approach if starting outside
    if (startPoint && (startPoint.id === "SP-GATE" || startPoint.id === "SP-PARK" || startPoint.id === "SP-NORTH-RAMP" || startPoint.id === "SP-EAST-RAMP")) {
      if (startPoint.id === "SP-GATE") {
        const rampR1 = this.data.locations.find(l => l.code === "R-01");
        waypoints.push([12.93540, 77.53530]);
        waypoints.push(rampR1 ? rampR1.coords : [12.93527, 77.53530]);
        
        steps.push({
          stepNumber: 2,
          type: "ramp",
          icon: "fa-wheelchair",
          instruction: "Proceed 35m south along the wide paved tactile walkway to North Entrance Ramp (R-01).",
          notes: "Ramp gradient is 1:12 with dual-height stainless steel handrails (70cm and 90cm).",
          distance: 35
        });
        totalDistanceMeters += 35;
      } else if (startPoint.id === "SP-PARK") {
        const rampR2 = this.data.locations.find(l => l.code === "R-02");
        waypoints.push([12.93480, 77.53600]);
        waypoints.push(rampR2 ? rampR2.coords : [12.93480, 77.53587]);

        steps.push({
          stepNumber: 2,
          type: "ramp",
          icon: "fa-wheelchair",
          instruction: "Head west from the Accessible Parking bay for 25m along the dedicated level pathway to East Ramp (R-02).",
          notes: "Gentle 1:14 slope with tactile border plants.",
          distance: 25
        });
        totalDistanceMeters += 25;
      }

      // Enter Main Atrium
      waypoints.push([12.93510, 77.53530]);
      steps.push({
        stepNumber: steps.length + 1,
        type: "door",
        icon: "fa-door-open",
        instruction: "Enter through the automatic motion-sensor sliding doors (110cm width, zero threshold).",
        notes: "Main Atrium reception and information desk are immediately on your left.",
        distance: 12
      });
      totalDistanceMeters += 12;
    }

    // Determine vertical transit (elevator) requirement
    const needsElevator = startFloor !== targetLoc.floorId;

    if (needsElevator) {
      const atriumLift = this.data.locations.find(l => l.code === "L-01" && l.floorId === startFloor) ||
                         this.data.locations.find(l => l.code === "L-01");
      const liftCoords = atriumLift ? atriumLift.coords : [12.93485, 77.53530];
      waypoints.push(liftCoords);

      const toLiftDist = Math.max(12, Math.round(this.calculateDistanceMeters(startCoords, liftCoords) || 20));
      const startFloorName = this.mapController ? this.mapController.getFloorName(startFloor) : startFloor;
      steps.push({
        stepNumber: steps.length + 1,
        type: "lift",
        icon: "fa-elevator",
        instruction: `Proceed ${toLiftDist}m to Main Passenger Lift (L-01) on ${startFloorName}.`,
        notes: "Lift features Braille buttons at 95cm height and audio floor voice announcements.",
        distance: toLiftDist
      });
      totalDistanceMeters += toLiftDist;

      const destFloorName = this.mapController ? this.mapController.getFloorName(targetLoc.floorId) : targetLoc.floorId;
      const isUp = this.getFloorLevelNumber(targetLoc.floorId) > this.getFloorLevelNumber(startFloor);
      steps.push({
        stepNumber: steps.length + 1,
        type: "lift-transfer",
        icon: isUp ? "fa-arrow-up" : "fa-arrow-down",
        instruction: `Take Lift L-01 ${isUp ? 'up' : 'down'} to ${destFloorName}.`,
        notes: "Elevator cabin has rear mirror and safety light curtain to keep doors held open safely.",
        distance: 0
      });

      // Corridor routing on destination floor
      waypoints.push([liftCoords[0], liftCoords[1] + 0.0001]);
      waypoints.push(targetLoc.coords);

      const corridorDist = Math.round(this.calculateDistanceMeters(liftCoords, targetLoc.coords) || 18);
      const estCorridorM = Math.max(corridorDist, 18);

      steps.push({
        stepNumber: steps.length + 1,
        type: "corridor",
        icon: "fa-signs-post",
        instruction: `Exit lift on ${destFloorName}, turn towards corridor and proceed ${estCorridorM}m down the 180cm wide hallway.`,
        notes: `Look for high-contrast door signage with raised tactile numerals for Room ${targetLoc.code || targetLoc.name}.`,
        distance: estCorridorM
      });
      totalDistanceMeters += estCorridorM;

    } else {
      // Both origin and destination are on the same floor!
      waypoints.push(targetLoc.coords);
      const walkDist = Math.round(this.calculateDistanceMeters(startCoords, targetLoc.coords) || 22);
      const estWalkM = Math.max(walkDist, 15);
      const currentFloorName = this.mapController ? this.mapController.getFloorName(startFloor) : "Ground Floor (L0)";

      steps.push({
        stepNumber: steps.length + 1,
        type: "corridor",
        icon: "fa-person-walking",
        instruction: `Proceed along the ${currentFloorName} corridor for ${estWalkM}m towards ${targetLoc.name}.`,
        notes: "Level non-slip flooring with continuous unobstructed clearance.",
        distance: estWalkM
      });
      totalDistanceMeters += estWalkM;
    }

    // Arrival Step
    steps.push({
      stepNumber: steps.length + 1,
      type: "arrive",
      icon: "fa-flag-checkered",
      instruction: `Arrive at ${targetLoc.name} (${targetLoc.code || ''}).`,
      notes: `${targetLoc.stepFree ? '✅ 100% Step-free accessible entrance.' : '⚠️ Caution: Notice step thresholds.'} Door clearance: ${targetLoc.doorWidthCm || 95}cm.`,
      distance: 0
    });

    // Transit calculations
    // Wheelchair / steady walking speed ~ 0.8 meters/second = ~48 meters/min
    // Plus 45 seconds for elevator wait/ride
    const walkMinutes = totalDistanceMeters / 48;
    const liftMinutes = needsElevator ? 0.75 : 0;
    const totalEstMinutes = Math.max(1, Math.ceil(walkMinutes + liftMinutes));

    const routeResult = {
      startId,
      startName,
      targetId,
      targetLocation: targetLoc,
      waypoints,
      steps,
      totalDistanceMeters,
      totalEstMinutes,
      isStepFree: preferStepFree && targetLoc.stepFree,
      hasElevator: needsElevator,
      warningNotes: preferStepFree ? [] : ["This route may contain stairs. Use caution."]
    };

    this.activeRoute = routeResult;
    return routeResult;
  }

  /**
   * Clears active route and resets display and map polyline
   */
  clearRoute(containerId = "routeResultsPanel") {
    this.activeRoute = null;
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
    }
    if (this.mapController) {
      this.mapController.clearRoute();
    }
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  /**
   * Renders the calculated route into the route display card / sidebar
   */
  renderRouteCard(route, containerId = "routeResultsPanel") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!route) {
      container.innerHTML = "";
      return;
    }

    if (route.isSameLocation) {
      container.innerHTML = `
        <div class="active-route-card route-feedback-card info-card" role="region" aria-label="Route Information">
          <div class="route-card-header">
            <div class="route-status-pill status-info">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
              Same Location
            </div>
            <button class="btn-icon-close" onclick="window.CampusApp.clearCurrentRoute()" title="Clear route" aria-label="Clear route">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <h3 class="route-destination-title">${this.escapeHtml(route.targetLocation.name)}</h3>
          <p class="route-feedback-message">
            Your selected start point and destination are the same location (<strong>${this.escapeHtml(route.targetLocation.name)}</strong>). You are already at this destination.
          </p>
          <div class="route-audio-bar">
            <button type="button" class="btn-secondary" onclick="window.CampusApp.clearCurrentRoute()" aria-label="Reset Route">
              <i class="fa-solid fa-arrow-rotate-left"></i> Reset Route
            </button>
          </div>
        </div>
      `;
      if (this.mapController) {
        this.mapController.clearRoute();
      }
      return;
    }

    if (route.noStepFreeRoute) {
      container.innerHTML = `
        <div class="active-route-card route-feedback-card warning-card" role="region" aria-label="Route Warning">
          <div class="route-card-header">
            <div class="route-status-pill status-warning">
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              No Step-Free Route
            </div>
            <button class="btn-icon-close" onclick="window.CampusApp.clearCurrentRoute()" title="Clear route" aria-label="Clear route">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <h3 class="route-destination-title">No Step-Free Route to ${this.escapeHtml(route.targetLocation.name)}</h3>
          <p class="route-feedback-message">
            ${this.escapeHtml(route.warningNotes[0] || 'No 100% step-free route is available to this destination because it has stepped access.')}
          </p>
          <div class="route-feedback-hint">
            <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
            <span>Tip: Uncheck <strong>"Step-free accessible route only"</strong> to view standard walking directions with stairs.</span>
          </div>
          <div class="route-audio-bar">
            <button type="button" class="btn-secondary" onclick="window.CampusApp.clearCurrentRoute()" aria-label="Reset Route">
              <i class="fa-solid fa-arrow-rotate-left"></i> Reset Route
            </button>
          </div>
        </div>
      `;
      if (this.mapController) {
        this.mapController.clearRoute();
      }
      return;
    }

    let stepsHtml = "";
    route.steps.forEach(s => {
      stepsHtml += `
        <li class="route-step-item">
          <div class="step-badge">
            <i class="fa-solid ${s.icon}"></i>
          </div>
          <div class="step-content">
            <div class="step-text">${s.instruction}</div>
            ${s.notes ? `<div class="step-note"><i class="fa-solid fa-circle-info"></i> ${s.notes}</div>` : ''}
            ${s.distance > 0 ? `<div class="step-dist">${s.distance} meters</div>` : ''}
          </div>
        </li>
      `;
    });

    const isStepFree = route.isStepFree;

    const html = `
      <div class="active-route-card">
        <div class="route-card-header">
          <div class="route-status-pill ${isStepFree ? 'status-accessible' : 'status-warning'}">
            <i class="fa-solid ${isStepFree ? 'fa-wheelchair' : 'fa-triangle-exclamation'}"></i>
            ${isStepFree ? '100% Step-Free Accessible Route' : 'Route Contains Stairs'}
          </div>
          <button class="btn-icon-close" onclick="window.CampusApp.clearCurrentRoute()" title="Clear route" aria-label="Clear route">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <h3 class="route-destination-title">
          Directions to ${route.targetLocation.name}
        </h3>

        <div class="route-metrics-bar">
          <div class="metric-item">
            <i class="fa-solid fa-person-walking"></i>
            <div>
              <span class="metric-val">${route.totalDistanceMeters}m</span>
              <span class="metric-lbl">Total Distance</span>
            </div>
          </div>
          <div class="metric-item">
            <i class="fa-solid fa-clock"></i>
            <div>
              <span class="metric-val">~${route.totalEstMinutes} min</span>
              <span class="metric-lbl">Est. Time</span>
            </div>
          </div>
          <div class="metric-item">
            <i class="fa-solid fa-elevator"></i>
            <div>
              <span class="metric-val">${route.hasElevator ? '1 Lift' : 'No Lift'}</span>
              <span class="metric-lbl">Vertical Transit</span>
            </div>
          </div>
        </div>

        <div class="route-audio-bar">
          <button type="button" class="btn-primary btn-mobile-view-map" onclick="window.CampusApp.closeMobileSidebar()" aria-label="View route on full map">
            <i class="fa-solid fa-map-location-dot"></i> View Route on Map
          </button>
          <button type="button" class="btn-audio-announce" onclick="window.CampusApp.readRouteAloud()" aria-label="Listen to step by step directions">
            <i class="fa-solid fa-volume-high"></i> Listen to Audio Guidance
          </button>
        </div>

        <div class="route-steps-container">
          <h4 class="steps-heading"><i class="fa-solid fa-diamond-turn-right"></i> Step-by-Step Directions</h4>
          <ol class="route-steps-list">
            ${stepsHtml}
          </ol>
        </div>

        <div class="route-footer-note">
          <i class="fa-solid fa-shield-halved"></i> 
          <span><strong>Safety Note:</strong> Corridors are equipped with 180cm turning radius and non-slip surfaces. Elevators remain in normal operation.</span>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Switch map floor to the destination floor so user sees their target!
    if (this.mapController.currentFloor !== route.targetLocation.floorId) {
      window.CampusApp.filters.selectFloor(route.targetLocation.floorId);
    }

    // Draw route on Leaflet map
    this.mapController.drawRoute(route.waypoints, route.isStepFree);
  }

  /**
   * Reads route aloud using the Web Speech API (Accessibility feature for blind / visually impaired users)
   */
  speakRoute(route) {
    if (!this.speechSynthesis) {
      alert("Text-to-speech audio is not supported in this browser.");
      return;
    }

    this.speechSynthesis.cancel(); // Stop any pending speech

    if (!route || !route.steps) return;

    let fullScript = `Step-by-step directions to ${route.targetLocation.name}. Estimated travel time is ${route.totalEstMinutes} minutes. `;
    route.steps.forEach(s => {
      fullScript += `Step ${s.stepNumber}: ${s.instruction}. ${s.notes} `;
    });

    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = 0.95; // slightly slower for maximum clarity
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Calculates Euclidean surface distance in meters between two lat/lng coordinates
   * Handles invalid or non-numeric inputs safely.
   */
  calculateDistanceMeters(coords1, coords2) {
    if (!Array.isArray(coords1) || coords1.length < 2 ||
        !Array.isArray(coords2) || coords2.length < 2) {
      return null;
    }

    const lat1 = Number(coords1[0]);
    const lng1 = Number(coords1[1]);
    const lat2 = Number(coords2[0]);
    const lng2 = Number(coords2[1]);

    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      return null;
    }

    const dLat = (lat2 - lat1) * 111000;
    const avgLatRad = ((lat1 + lat2) / 2) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * 111000 * Math.cos(avgLatRad);

    return Math.sqrt((dLat * dLat) + (dLng * dLng));
  }

  /**
   * Maps floor IDs to numeric levels for vertical transfer calculations
   */
  getFloorLevelNumber(floorId) {
    if (!floorId || typeof floorId !== "string") return 0;
    const clean = floorId.trim().toUpperCase();
    if (clean === "L0" || clean === "G" || clean === "OUTDOOR") return 0;
    if (clean === "L1" || clean === "1F" || clean === "FLOOR 1") return 1;
    if (clean === "L2" || clean === "2F" || clean === "FLOOR 2") return 2;
    return 0;
  }

  /**
   * Finds the nearest accessible amenity of a given category from origin coordinates.
   *
   * Applies same-floor preference: Each floor difference incurs a 250m penalty
   * to prioritize same-floor accessible facilities without unnecessary vertical elevator transit.
   *
   * Robust against invalid coordinates, missing categories, and empty data.
   */
  findNearestAmenity(originCoords, originFloorId = "L0", categoryKey = "washrooms", options = {}) {
    // 1. Validate origin coordinates
    if (!Array.isArray(originCoords) || originCoords.length < 2) {
      return null;
    }
    const origLat = Number(originCoords[0]);
    const origLng = Number(originCoords[1]);
    if (isNaN(origLat) || isNaN(origLng)) {
      return null;
    }

    // 2. Validate category and dataset
    if (!categoryKey || typeof categoryKey !== "string" || !this.data || !Array.isArray(this.data.locations)) {
      return null;
    }

    const targetCategory = categoryKey.trim().toLowerCase();
    const originLevel = this.getFloorLevelNumber(originFloorId);

    // 3. Filter candidates
    let candidates = this.data.locations.filter(loc => {
      if (!loc || !loc.category || loc.category.toLowerCase() !== targetCategory) {
        return false;
      }
      // If searching for entrance ramps, prioritize actual entrance ramps
      if (targetCategory === "ramps" && !options.includeAllRampTypes) {
        const isRampCode = loc.code && String(loc.code).toUpperCase().startsWith("R-");
        const hasSlope = Boolean(loc.slopeGradient);
        const hasRampName = loc.name && loc.name.toLowerCase().includes("ramp");
        return isRampCode || hasSlope || hasRampName;
      }
      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    let closestAmenity = null;
    let minEffectiveDistance = Infinity;
    let closestGroundDistance = Infinity;
    let closestFloorDiff = 0;

    for (const loc of candidates) {
      // Validate candidate coordinates
      const dist = this.calculateDistanceMeters(originCoords, loc.coords);
      if (dist === null) {
        continue; // skip corrupt coordinates safely
      }

      const targetLevel = this.getFloorLevelNumber(loc.floorId);
      const floorDiff = Math.abs(originLevel - targetLevel);

      // 250 meters penalty per floor difference to prioritize same floor
      const effectiveDist = dist + (floorDiff * 250);

      if (effectiveDist < minEffectiveDistance) {
        minEffectiveDistance = effectiveDist;
        closestGroundDistance = dist;
        closestAmenity = loc;
        closestFloorDiff = floorDiff;
      }
    }

    if (!closestAmenity) {
      return null;
    }

    return {
      amenity: closestAmenity,
      distanceMeters: Math.max(5, Math.round(closestGroundDistance)),
      effectiveDistance: Math.round(minEffectiveDistance),
      isSameFloor: closestFloorDiff === 0,
      floorDiff: closestFloorDiff,
      originFloorId: originFloorId,
      targetFloorId: closestAmenity.floorId
    };
  }

  /**
   * Generates a nearby summary of essential accessible amenities (Restroom, Lift, Water, Ramp)
   * for a specific location or reference point.
   */
  getNearbyAmenitiesSummary(originCoords, originFloorId = "L0") {
    if (!Array.isArray(originCoords) || originCoords.length < 2) {
      return null;
    }

    return {
      washroom: this.findNearestAmenity(originCoords, originFloorId, "washrooms"),
      lift: this.findNearestAmenity(originCoords, originFloorId, "lifts"),
      water: this.findNearestAmenity(originCoords, originFloorId, "water"),
      ramp: this.findNearestAmenity(originCoords, originFloorId, "ramps")
    };
  }
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.CampusRouter = CampusRouter;
}
