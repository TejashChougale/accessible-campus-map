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
      this.activeRoute = null;
      return noStepFreeResult;
    }

    // Waypoints array for map polyline
    const waypoints = [];
    waypoints.push(startCoords);

    // Turn-by-turn steps
    const steps = [];
    let totalDistanceMeters = 0;
    let currentCoords = startCoords;

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
          notes: "Demonstration route model: 25m approach to East Ramp. Simulated model assumption, not verified survey measurement.",
          distance: 25
        });
        totalDistanceMeters += 25;
      } else if (startPoint.id === "SP-EAST-RAMP") {
        const rampR2 = this.data.locations.find(l => l.code === "R-02");
        waypoints.push(rampR2 ? rampR2.coords : [12.93480, 77.53587]);

        steps.push({
          stepNumber: 2,
          type: "ramp",
          icon: "fa-wheelchair",
          instruction: "Ascend East Ramp (R-02) along the gentle 1:14 slope with continuous handrails.",
          notes: "Demonstration route model: 10m ramp ascent. Simulated model assumption, not verified survey measurement.",
          distance: 10
        });
        totalDistanceMeters += 10;
      } else if (startPoint.id === "SP-NORTH-RAMP") {
        const rampR1 = this.data.locations.find(l => l.code === "R-01");
        waypoints.push(rampR1 ? rampR1.coords : [12.93527, 77.53530]);

        steps.push({
          stepNumber: 2,
          type: "ramp",
          icon: "fa-wheelchair",
          instruction: "Ascend North Main Entrance Ramp (R-01) with dual-height handrails.",
          notes: "Demonstration route model: 10m ramp ascent. Simulated model assumption, not verified survey measurement.",
          distance: 10
        });
        totalDistanceMeters += 10;
      }

      // Enter Main Atrium
      const atriumCoords = [12.93510, 77.53530];
      waypoints.push(atriumCoords);
      steps.push({
        stepNumber: steps.length + 1,
        type: "door",
        icon: "fa-door-open",
        instruction: "Enter through the automatic motion-sensor sliding doors (110cm width, zero threshold).",
        notes: "Demonstration route model: 12m covered approach into Main Atrium. Simulated model assumption, not verified survey measurement.",
        distance: 12
      });
      totalDistanceMeters += 12;
      currentCoords = atriumCoords;
    }

    // Determine vertical transit (elevator) requirement
    const needsElevator = startFloor !== targetLoc.floorId;
    let usedLift = null;

    if (needsElevator) {
      // Evaluate candidate accessible lifts (L-01 Main Atrium, L-02 East Wing)
      const liftCodes = ["L-01", "L-02"];
      const candidates = [];

      liftCodes.forEach(code => {
        const startLift = this.data.locations.find(l => l.code === code && l.floorId === startFloor && l.stepFree !== false);
        const destLift = this.data.locations.find(l => l.code === code && l.floorId === targetLoc.floorId && l.stepFree !== false);
        if (startLift && destLift) {
          const rawToLift = this.calculateDistanceMeters(currentCoords, startLift.coords);
          const toLift = Math.max(12, Math.round(rawToLift !== null ? rawToLift : 20));
          const rawFromLift = this.calculateDistanceMeters(destLift.coords, targetLoc.coords);
          const fromLift = Math.max(15, Math.round(rawFromLift !== null ? rawFromLift : 18));
          candidates.push({
            code,
            startLift,
            destLift,
            toLiftDist: toLift,
            corridorDist: fromLift,
            totalWalk: toLift + fromLift
          });
        }
      });

      // Sort candidate lifts:
      // Multi-floor accessible routing prioritizes the lift that minimizes corridor walking
      // distance to the destination room on the target floor (delivering the user to the
      // target wing/zone). When corridor distances are within 3 meters (or equal),
      // total walking distance is used as a tiebreaker, defaulting to L-01.
      candidates.sort((a, b) => {
        const corridorDiff = a.corridorDist - b.corridorDist;
        if (Math.abs(corridorDiff) > 3) {
          return corridorDiff;
        }
        const totalWalkDiff = a.totalWalk - b.totalWalk;
        if (Math.abs(totalWalkDiff) > 3) {
          return totalWalkDiff;
        }
        return a.code === "L-01" ? -1 : 1;
      });

      const chosen = candidates.length > 0 ? candidates[0] : null;
      const liftCode = chosen ? chosen.code : "L-01";
      const liftStart = chosen ? chosen.startLift : (this.data.locations.find(l => l.code === "L-01" && l.floorId === startFloor) || this.data.locations.find(l => l.code === "L-01"));
      const liftCoords = liftStart ? liftStart.coords : [12.93485, 77.53530];
      const toLiftDist = chosen ? chosen.toLiftDist : Math.max(12, Math.round(this.calculateDistanceMeters(currentCoords, liftCoords) || 20));
      const estCorridorM = chosen ? chosen.corridorDist : 18;

      usedLift = {
        code: liftCode,
        name: liftCode === "L-02" ? "East Wing Lift (L-02)" : "Main Passenger Lift (L-01)",
        coords: liftCoords
      };

      waypoints.push(liftCoords);

      const startFloorName = this.mapController ? this.mapController.getFloorName(startFloor) : startFloor;
      const liftDisplayName = liftCode === "L-02" ? "East Wing Lift (L-02)" : "Main Passenger Lift (L-01)";
      const liftNotes = liftCode === "L-02"
        ? "Demonstration model elevator (East Wing L-02) for prototype multi-floor navigation testing. Not certified real campus equipment."
        : "Demonstration model elevator (Main Passenger L-01) for prototype multi-floor navigation testing. Not certified real campus equipment.";

      steps.push({
        stepNumber: steps.length + 1,
        type: "lift",
        icon: "fa-elevator",
        instruction: `Proceed ${toLiftDist}m to ${liftDisplayName} on ${startFloorName}.`,
        notes: liftNotes,
        distance: toLiftDist
      });
      totalDistanceMeters += toLiftDist;
      currentCoords = liftCoords;

      const destFloorName = this.mapController ? this.mapController.getFloorName(targetLoc.floorId) : targetLoc.floorId;
      const isUp = this.getFloorLevelNumber(targetLoc.floorId) > this.getFloorLevelNumber(startFloor);
      steps.push({
        stepNumber: steps.length + 1,
        type: "lift-transfer",
        icon: isUp ? "fa-arrow-up" : "fa-arrow-down",
        instruction: `Take ${liftDisplayName} ${isUp ? 'up' : 'down'} to ${destFloorName}.`,
        notes: "Demonstration elevator transfer model. Not verified physical campus equipment.",
        distance: 0
      });

      // Corridor routing on destination floor
      waypoints.push([liftCoords[0], liftCoords[1] + 0.0001]);
      waypoints.push(targetLoc.coords);

      steps.push({
        stepNumber: steps.length + 1,
        type: "corridor",
        icon: "fa-signs-post",
        instruction: `Exit lift on ${destFloorName}, turn towards corridor and proceed ${estCorridorM}m down the 180cm wide hallway.`,
        notes: `Look for high-contrast door signage with raised tactile numerals for Room ${targetLoc.code || targetLoc.name}.`,
        distance: estCorridorM
      });
      totalDistanceMeters += estCorridorM;
      currentCoords = targetLoc.coords;

    } else {
      // Both origin and destination are on the same floor!
      waypoints.push(targetLoc.coords);
      const walkDist = Math.round(this.calculateDistanceMeters(currentCoords, targetLoc.coords) || 22);
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
      currentCoords = targetLoc.coords;
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

    const routeIsStepFree = targetLoc.stepFree !== false;

    const routeResult = {
      startId,
      startName,
      targetId,
      targetLocation: targetLoc,
      waypoints,
      steps,
      totalDistanceMeters,
      totalEstMinutes,
      isStepFree: routeIsStepFree,
      hasElevator: needsElevator,
      usedLiftCode: usedLift ? usedLift.code : null,
      usedLiftName: usedLift ? usedLift.name : null,
      warningNotes: routeIsStepFree ? [] : ["This route contains stairs or stepped thresholds. Use caution."]
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
   * Retrieves active community reports (either from CampusReportsManager or localStorage)
   */
  getActiveUserReports() {
    let reports = [];
    if (typeof window !== "undefined" && window.CampusApp && window.CampusApp.reports && Array.isArray(window.CampusApp.reports.reports)) {
      reports = window.CampusApp.reports.reports;
    } else {
      try {
        const stored = typeof localStorage !== "undefined" ? localStorage.getItem("accessible_campus_user_reports") : null;
        if (stored) {
          reports = JSON.parse(stored);
        } else if (this.data && Array.isArray(this.data.sampleReports)) {
          reports = this.data.sampleReports;
        }
      } catch (e) {
        if (this.data && Array.isArray(this.data.sampleReports)) {
          reports = this.data.sampleReports;
        }
      }
    }

    return reports.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status !== "resolved";
    });
  }

  /**
   * Checks active community reports for issues matching facilities actually used on this route.
   * Returns non-blocking advisories without altering route calculation.
   */
  findMatchingRouteAdvisories(route) {
    if (!route) return [];

    const activeReports = this.getActiveUserReports();
    if (!activeReports || activeReports.length === 0) return [];

    const advisories = [];
    const matchedFacilities = new Set();

    // 1. Check elevator if route uses an elevator
    if (route.hasElevator) {
      const liftCode = route.usedLiftCode || "L-01";
      const liftReport = activeReports.find(rep => {
        const text = `${rep.issueType || ''} ${rep.locationName || ''} ${rep.description || ''}`.toLowerCase();
        if (liftCode === "L-02") {
          return text.includes("l-02") || text.includes("east wing lift");
        } else {
          const isLiftIssue = text.includes("elevator") || text.includes("lift") || text.includes("l-01");
          const isOtherLift = text.includes("l-02") || text.includes("east wing lift");
          return isLiftIssue && !isOtherLift;
        }
      });

      const facilityName = liftCode === "L-02" ? "Lift L-02" : "Lift L-01";
      if (liftReport && !matchedFacilities.has(facilityName)) {
        matchedFacilities.add(facilityName);
        advisories.push({ facility: facilityName, report: liftReport });
      }
    }

    // 2. Check entrance ramps if route uses them
    const usesNorthRamp = route.startPointId === "SP-GATE" || route.startPointId === "SP-NORTH-RAMP" ||
                          (route.steps && route.steps.some(s => (s.instruction || '').includes("R-01")));
    if (usesNorthRamp) {
      const ramp1Report = activeReports.find(rep => {
        const text = `${rep.issueType || ''} ${rep.locationName || ''} ${rep.description || ''}`.toLowerCase();
        return (text.includes("r-01") || (text.includes("north") && text.includes("ramp"))) && !text.includes("r-02");
      });
      if (ramp1Report && !matchedFacilities.has("North Entrance Ramp (R-01)")) {
        matchedFacilities.add("North Entrance Ramp (R-01)");
        advisories.push({ facility: "North Entrance Ramp (R-01)", report: ramp1Report });
      }
    }

    const usesEastRamp = route.startPointId === "SP-PARK" ||
                         (route.steps && route.steps.some(s => (s.instruction || '').includes("R-02")));
    if (usesEastRamp) {
      const ramp2Report = activeReports.find(rep => {
        const text = `${rep.issueType || ''} ${rep.locationName || ''} ${rep.description || ''}`.toLowerCase();
        return (text.includes("r-02") || (text.includes("east") && text.includes("ramp"))) && !text.includes("r-01");
      });
      if (ramp2Report && !matchedFacilities.has("East Ramp (R-02)")) {
        matchedFacilities.add("East Ramp (R-02)");
        advisories.push({ facility: "East Ramp (R-02)", report: ramp2Report });
      }
    }

    // 3. Check target destination
    if (route.targetLocation) {
      const targetCode = (route.targetLocation.code || '').toLowerCase();
      const targetName = (route.targetLocation.name || '').toLowerCase();
      const targetReport = activeReports.find(rep => {
        const text = `${rep.locationName || ''} ${rep.description || ''}`.toLowerCase();
        if (targetCode && text.includes(targetCode)) return true;
        if (targetName && text.includes(targetName)) return true;
        return false;
      });
      if (targetReport && !matchedFacilities.has(route.targetLocation.name)) {
        matchedFacilities.add(route.targetLocation.name);
        advisories.push({ facility: route.targetLocation.name, report: targetReport });
      }
    }

    return advisories;
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
            <span>Tip: Uncheck <strong>"Prioritize Step-Free Paths"</strong> to view standard walking directions with stairs.</span>
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
    const matchingAdvisories = this.findMatchingRouteAdvisories(route);

    let advisoriesHtml = "";
    if (matchingAdvisories.length > 0) {
      advisoriesHtml = matchingAdvisories.map(adv => `
        <div class="route-advisory-box" role="status">
          <i class="fa-solid fa-circle-exclamation"></i>
          <div class="route-advisory-text">
            <strong>Community Report (Unverified):</strong> A user has reported an issue with ${this.escapeHtml(adv.facility)}. Please verify its availability.
          </div>
        </div>
      `).join("");
    }

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

        ${advisoriesHtml}

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
          <span><strong>Prototype Demonstration Notice:</strong> Route distances and elevator transitions are simulated algorithmic estimates based on a prototype campus model. Facilities and distances are not verified against physical campus surveys in Bagalkot.${route.hasElevator ? ' Route includes passenger elevator transit for floor access.' : ''}</span>
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
