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
      startFloor = startPoint.floorId;
    } else {
      // Could be another location ID
      const startLoc = this.data.locations.find(l => l.id === startId);
      if (startLoc) {
        startCoords = startLoc.coords;
        startName = startLoc.name;
        startFloor = startLoc.floorId;
      } else {
        // Fallback default: Campus Main Gate
        startPoint = this.data.startingPoints[0];
        startCoords = startPoint.coords;
        startName = startPoint.name;
        startFloor = startPoint.floorId;
      }
    }

    // Waypoints array for map polyline
    const waypoints = [];
    waypoints.push(startCoords);

    // Turn-by-turn steps
    const steps = [];
    let totalDistanceMeters = 0;
    const isTargetUpperFloor = targetLoc.floorId !== "L0";

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
    if (startPoint && (startPoint.id === "SP-GATE" || startPoint.id === "SP-PARK")) {
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

    // Step into Atrium Center
    const atriumLift = this.data.locations.find(l => l.code === "L-01" && l.floorId === "L0");
    const liftCoords = atriumLift ? atriumLift.coords : [12.93485, 77.53530];

    // If destination is on upper floor (L1 or L2)
    if (isTargetUpperFloor) {
      waypoints.push(liftCoords);

      steps.push({
        stepNumber: steps.length + 1,
        type: "lift",
        icon: "fa-elevator",
        instruction: `Proceed to Main Passenger Lift (L-01) in the central atrium.`,
        notes: "Lift features Braille buttons at 95cm height and audio floor voice announcements.",
        distance: 20
      });
      totalDistanceMeters += 20;

      steps.push({
        stepNumber: steps.length + 1,
        type: "lift-transfer",
        icon: "fa-arrow-up",
        instruction: `Take Lift L-01 up to ${this.mapController.getFloorName(targetLoc.floorId)}.`,
        notes: "Elevator cabin has rear mirror and safety light curtain to keep doors held open safely.",
        distance: 0
      });

      // Corridor routing on destination floor
      waypoints.push([liftCoords[0], liftCoords[1] + 0.0001]);
      waypoints.push(targetLoc.coords);

      const corridorDist = Math.round(Math.abs(targetLoc.coords[0] - liftCoords[0]) * 111000 + Math.abs(targetLoc.coords[1] - liftCoords[1]) * 111000);
      const estCorridorM = Math.max(corridorDist, 18);

      steps.push({
        stepNumber: steps.length + 1,
        type: "corridor",
        icon: "fa-signs-post",
        instruction: `Exit lift, turn towards corridor and proceed ${estCorridorM}m down the 180cm wide hallway.`,
        notes: `Look for high-contrast door signage with raised tactile numerals for Room ${targetLoc.code || targetLoc.name}.`,
        distance: estCorridorM
      });
      totalDistanceMeters += estCorridorM;

    } else {
      // Destination is on Ground Floor
      waypoints.push(targetLoc.coords);
      const walkDist = Math.round(Math.abs(targetLoc.coords[0] - startCoords[0]) * 111000 + Math.abs(targetLoc.coords[1] - startCoords[1]) * 111000);
      const estWalkM = Math.max(walkDist, 22);

      steps.push({
        stepNumber: steps.length + 1,
        type: "corridor",
        icon: "fa-person-walking",
        instruction: `Proceed along the ground floor corridor for ${estWalkM}m towards ${targetLoc.name}.`,
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
    const liftMinutes = isTargetUpperFloor ? 0.75 : 0;
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
      hasElevator: isTargetUpperFloor,
      warningNotes: preferStepFree ? [] : ["This route may contain stairs. Use caution."]
    };

    this.activeRoute = routeResult;
    return routeResult;
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
}

// Expose on global window object
if (typeof window !== "undefined") {
  window.CampusRouter = CampusRouter;
}
