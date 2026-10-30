/**
 * ACCESSIBLE CAMPUS MAP - SAMPLE DATA STORE
 * 
 * NOTICE: All campus coordinates, room numbers, accessibility ratings, and path 
 * segments in this file are SAMPLE DEMONSTRATION DATA for educational prototype testing.
 * They should be replaced with verified campus survey data before official deployment.
 */

const CAMPUS_DATA = {
  // Center of the sample college campus
  campusCenter: [12.93485, 77.53535],
  defaultZoom: 18,
  
  // Campus boundary outline for visual context
  campusBoundary: [
    [12.93600, 77.53380],
    [12.93600, 77.53700],
    [12.93380, 77.53700],
    [12.93380, 77.53380]
  ],

  // Buildings supported by the campus map
  buildings: [
    {
      id: "block-a",
      name: "Main Academic Block (MAB)",
      fullName: "Sir M. Visvesvaraya Engineering Academic Block",
      code: "MAB",
      description: "Primary 3-floor academic building housing Information Science & Engineering, Computer Labs, Lecture Theatres, Dean's Office, and Student Services.",
      floors: [
        { id: "L0", name: "Ground Floor (L0)", shortName: "G", level: 0, heightNote: "Street & Courtyard level access" },
        { id: "L1", name: "First Floor (L1)", shortName: "1F", level: 1, heightNote: "Accessible via Lifts L-01 & L-02" },
        { id: "L2", name: "Second Floor (L2)", shortName: "2F", level: 2, heightNote: "Accessible via Lifts L-01 & L-02" }
      ],
      // Building geographical footprint
      polygon: [
        [12.93525, 77.53480],
        [12.93525, 77.53585],
        [12.93440, 77.53585],
        [12.93440, 77.53480]
      ],
      entrances: [
        {
          id: "ent-north",
          name: "North Main Entrance (Ramp R-01)",
          floorId: "L0",
          coords: [12.93525, 77.53532],
          accessible: true,
          type: "ramp",
          notes: "Equipped with Ramp R-01 (1:12 gradient), double handrails, and automatic sliding door."
        },
        {
          id: "ent-south",
          name: "South Courtyard Entrance (Stairs Only)",
          floorId: "L0",
          coords: [12.93440, 77.53532],
          accessible: false,
          type: "stairs",
          notes: "4 stone steps (no ramp). Wheelchair users should divert 30m east to East Ramp R-02."
        },
        {
          id: "ent-east",
          name: "East Wing Accessible Entrance (Ramp R-02)",
          floorId: "L0",
          coords: [12.93482, 77.53585],
          accessible: true,
          type: "ramp",
          notes: "Direct step-free connection from Accessible Parking Bay via smooth paved walkway."
        }
      ]
    }
    // Future buildings can easily be added here (e.g. Science Block, Central Library, Sports Arena)
  ],

  // Filter Categories
  categories: {
    ramps: {
      id: "ramps",
      label: "Ramps & Inclines",
      icon: "fa-wheelchair",
      color: "#2563eb",
      badgeClass: "badge-blue",
      description: "Gentle step-free sloped walkways with handrails"
    },
    lifts: {
      id: "lifts",
      label: "Lifts & Elevators",
      icon: "fa-elevator",
      color: "#7c3aed",
      badgeClass: "badge-purple",
      description: "Wheelchair-friendly elevators with Braille & voice announcements"
    },
    washrooms: {
      id: "washrooms",
      label: "Accessible Washrooms",
      icon: "fa-restroom",
      color: "#059669",
      badgeClass: "badge-green",
      description: "Unisex universal restrooms with grab rails and wide sliding doors"
    },
    water: {
      id: "water",
      label: "Drinking Water",
      icon: "fa-faucet-drip",
      color: "#0284c7",
      badgeClass: "badge-cyan",
      description: "Lowered height, sensor-operated filtered water stations"
    },
    seating: {
      id: "seating",
      label: "Seating & Rest Areas",
      icon: "fa-chair",
      color: "#d97706",
      badgeClass: "badge-amber",
      description: "Ergonomic resting benches and quiet areas with power outlets"
    },
    classrooms: {
      id: "classrooms",
      label: "Classrooms & Labs",
      icon: "fa-chalkboard-user",
      color: "#4f46e5",
      badgeClass: "badge-indigo",
      description: "Instructional lecture halls, computer labs, and department offices"
    },
    stairs: {
      id: "stairs",
      label: "Stairs (Step Alerts)",
      icon: "fa-stairs",
      color: "#dc2626",
      badgeClass: "badge-red",
      description: "Staircases with steps (Non-wheelchair accessible)"
    },
    emergency: {
      id: "emergency",
      label: "Emergency & Refuge",
      icon: "fa-person-running",
      color: "#ea580c",
      badgeClass: "badge-orange",
      description: "Wheelchair fire evacuation exits & safe refuge lobbies with Evac-Chairs"
    }
  },

  // Locations / Points of Interest
  locations: [
    // ==========================================
    // GROUND FLOOR (L0) LOCATIONS
    // ==========================================
    {
      id: "LOC-G-01",
      code: "101",
      name: "LH-101: ISE First Year Lecture Hall",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93505, 77.53500],
      accessibilityRating: "Fully Accessible",
      doorWidthCm: 100,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Extra-wide double doors (100cm)",
        "Dedicated front-row wheelchair desks",
        "Assistive FM hearing loop installed",
        "Power outlets at wheelchair height (75cm)"
      ],
      notes: "Direct flat access from Main Atrium. No steps required.",
      contact: "Department Coordinator: Ext 201"
    },
    {
      id: "LOC-G-02",
      code: "102",
      name: "Basic Electronics & IoT Lab",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93470, 77.53500],
      accessibilityRating: "Fully Accessible",
      doorWidthCm: 95,
      threshold: "Level (<0.5 cm)",
      stepFree: true,
      features: [
        "Aisle width 120cm between lab benches",
        "Adjustable height test station #1",
        "Anti-static slip resistant flooring"
      ],
      notes: "Lab instructor station has ramped access.",
      contact: "Lab Admin: Ext 202"
    },
    {
      id: "LOC-G-03",
      code: "104",
      name: "ISE Department Office & HOD Cabin",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93450, 77.53520],
      accessibilityRating: "Fully Accessible",
      doorWidthCm: 92,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Lowered inquiry counter (76cm height)",
        "Priority seating area inside office",
        "Sign language assistance scheduled on Mon/Thu"
      ],
      notes: "Main administrative point for ISE student requests and accessible exam accommodations.",
      contact: "HOD Office: hod.ise@campus.edu"
    },
    {
      id: "LOC-G-RAMP1",
      code: "R-01",
      name: "North Main Entrance Ramp",
      category: "ramps",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93527, 77.53530],
      accessibilityRating: "ADA & Standards Compliant",
      slopeGradient: "1:12 (Gentle Incline)",
      widthCm: 150,
      handrails: "Dual height on both sides (70cm and 90cm)",
      surface: "Textured brushed granite (High slip resistance)",
      stepFree: true,
      features: [
        "Gentle slope ratio 1:12",
        "Tactile warning strip at top and bottom",
        "Covered all-weather canopy",
        "Bright LED illumination for night visibility"
      ],
      notes: "Primary recommended step-free route from Campus North Drop-off."
    },
    {
      id: "LOC-G-RAMP2",
      code: "R-02",
      name: "East Garden Access Ramp",
      category: "ramps",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93480, 77.53587],
      accessibilityRating: "Fully Accessible",
      slopeGradient: "1:14 (Very Gentle)",
      widthCm: 140,
      handrails: "Continuous stainless steel rails",
      surface: "Interlocking permeable pavers",
      stepFree: true,
      features: [
        "Gentle 1:14 slope",
        "Connects directly from Accessible Parking Bay A",
        "Landscaping with fragrant guide plants for tactile navigation"
      ],
      notes: "Connects the East parking area smoothly into the Ground Floor corridor."
    },
    {
      id: "LOC-G-LIFT1",
      code: "L-01",
      name: "Main Atrium Passenger Lift (Wheelchair Sized)",
      category: "lifts",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93485, 77.53530],
      accessibilityRating: "Universal Wheelchair Access",
      capacityKg: 1000,
      doorWidthCm: 110,
      stepFree: true,
      features: [
        "Internal dimensions: 150cm x 160cm (Space for turning)",
        "Braille and raised embossed buttons at 95cm height",
        "Audio voice announcement for all floors (English & Local language)",
        "Full-height mirror on rear wall to assist backing out",
        "Safety light sensor curtains prevent premature door closing"
      ],
      notes: "Primary elevator serving Ground Floor (L0), Floor 1 (L1), and Floor 2 (L2)."
    },
    {
      id: "LOC-G-LIFT2",
      code: "L-02",
      name: "East Wing Stretcher & Service Lift",
      category: "lifts",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93470, 77.53570],
      accessibilityRating: "High Capacity Accessible",
      capacityKg: 1250,
      doorWidthCm: 120,
      stepFree: true,
      features: [
        "Extra-large cabin capable of motorized oversized wheelchairs",
        "Voice synthesizer and chime indicators",
        "Dual horizontal button pads"
      ],
      notes: "Alternative elevator located near the East Wing exit."
    },
    {
      id: "LOC-G-WASH1",
      code: "W-01",
      name: "Unisex Accessible Restroom (Ground Floor)",
      category: "washrooms",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93495, 77.53555],
      accessibilityRating: "Full Universal Standard",
      doorWidthCm: 95,
      stepFree: true,
      features: [
        "Lightweight sliding door with large D-handle",
        "L-shaped and drop-down grab bars on both sides of toilet",
        "Toilet seat height 46cm with backrest",
        "Sensor wash basin with knee clearance for wheelchair users",
        "Emergency red pull-cord alarm connected to Security Desk",
        "Non-slip ceramic floor"
      ],
      notes: "Regularly inspected. Keyless push-to-lock button with external occupancy LED."
    },
    {
      id: "LOC-G-WATER1",
      code: "DW-01",
      name: "Lowered Drinking Water Station (Atrium)",
      category: "water",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93478, 77.53535],
      accessibilityRating: "Accessible Height",
      heightCm: 78,
      stepFree: true,
      features: [
        "Hands-free motion sensor tap + easy paddle push control",
        "Clear knee space underneath (70cm clearance)",
        "Filtered cold & ambient drinking water",
        "Tactile floor pad indicator in front"
      ],
      notes: "Situated right next to the Main Atrium notice board."
    },
    {
      id: "LOC-G-SEAT1",
      code: "REST-01",
      name: "Atrium Quiet Rest Zone & Charging Station",
      category: "seating",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93510, 77.53540],
      accessibilityRating: "Rest & Power Facility",
      stepFree: true,
      features: [
        "Benches with firm back support and armrests",
        "Designated 100cm gap for parking a wheelchair alongside companions",
        "15A standard power sockets for electric wheelchair battery charging",
        "Acoustic baffle panels for sensory-friendly reduced echo"
      ],
      notes: "Ideal spot for resting between lectures or charging power mobility aids."
    },
    {
      id: "LOC-G-STAIRS1",
      code: "ST-01",
      name: "Main Atrium Central Staircase",
      category: "stairs",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93488, 77.53520],
      accessibilityRating: "NOT Accessible for Wheels",
      stepCount: 22,
      stepFree: false,
      features: [
        "22 concrete steps with high-contrast yellow edge strips",
        "Dual handrails on left and right",
        "Tactile blister paving alert at top and bottom landings"
      ],
      notes: "⚠️ NON-ACCESSIBLE ROUTE FOR WHEELCHAIRS OR CRUTCHES. Please use Lift L-01 located 12m away."
    },
    {
      id: "LOC-G-EMERG1",
      code: "EM-01",
      name: "North-West Emergency Fire Exit",
      category: "emergency",
      buildingId: "block-a",
      floorId: "L0",
      coords: [12.93520, 77.53485],
      accessibilityRating: "Emergency Egress Point",
      doorWidthCm: 110,
      stepFree: true,
      features: [
        "Full-width panic crash push-bar",
        "Level zero-step exit to outdoor lawn assembly area",
        "Green illuminated photoluminescent exit signage with audio siren beacon"
      ],
      notes: "Primary step-free ground escape route in the event of building evacuation."
    },

    // ==========================================
    // FIRST FLOOR (L1) LOCATIONS
    // ==========================================
    {
      id: "LOC-1-01",
      code: "201",
      name: "Data Structures & Algorithms Lab (Lab 1)",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93505, 77.53500],
      accessibilityRating: "Fully Accessible",
      doorWidthCm: 98,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Wide aisles (115cm) between computer rows",
        "4 motorized height-adjustable desks (Stations 1, 2, 15, 16)",
        "Screen magnifier software (NVDA & ZoomText) installed on stations 1-4",
        "High-contrast large-print keycaps available on request"
      ],
      notes: "Accessible from Lift L-01: Exit lift, turn right and proceed 15m down corridor.",
      contact: "Lab In-charge: Ext 301"
    },
    {
      id: "LOC-1-02",
      code: "202",
      name: "LH-201: Second Year ISE Lecture Hall",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93465, 77.53500],
      accessibilityRating: "Ramped Tier Access",
      doorWidthCm: 95,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Internal ramp leads to front seating row and lecturer podium",
        "Integrated microphone system with FM assistive listening headset",
        "Glazed anti-glare projector display"
      ],
      notes: "Front row has 2 designated wheelchair spaces with folding desks.",
      contact: "Class Teacher: Ext 302"
    },
    {
      id: "LOC-1-03",
      code: "204",
      name: "Sir MV Memorial Seminar Hall",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93450, 77.53550],
      accessibilityRating: "Fully Accessible Venue",
      doorWidthCm: 120,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "180-seat auditorium with zero-step entry",
        "Permanent side ramp to stage/podium for disabled speakers",
        "Reserved front wheelchair seating zone",
        "Acoustic induction loop for hearing aid users (Switch to 'T' mode)"
      ],
      notes: "Venue for department seminars, guest lectures, and placement orientation.",
      contact: "Events Desk: Ext 305"
    },
    {
      id: "LOC-1-LIFT1",
      code: "L-01",
      name: "Floor 1 Landing - Main Atrium Lift",
      category: "lifts",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93485, 77.53530],
      accessibilityRating: "Universal Wheelchair Access",
      doorWidthCm: 110,
      stepFree: true,
      features: [
        "Audio and tactile level 1 chime indicator",
        "Flush threshold transition to corridor tiles",
        "Call button at 95cm height with tactile star symbol"
      ],
      notes: "Direct connection to Ground Floor and 2nd Floor."
    },
    {
      id: "LOC-1-LIFT2",
      code: "L-02",
      name: "Floor 1 Landing - East Wing Lift",
      category: "lifts",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93470, 77.53570],
      accessibilityRating: "Accessible Elevator",
      doorWidthCm: 120,
      stepFree: true,
      features: [
        "Wide landing area suitable for power wheelchairs",
        "Voice announcement"
      ],
      notes: "Closest lift to Seminar Hall 204."
    },
    {
      id: "LOC-1-WASH1",
      code: "W-02",
      name: "Accessible Restroom (Floor 1 East)",
      category: "washrooms",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93495, 77.53555],
      accessibilityRating: "Full Universal Standard",
      doorWidthCm: 95,
      stepFree: true,
      features: [
        "Sliding door with lock indicator",
        "Dual grab bars, toilet with backrest",
        "Emergency red pull-cord linked to building supervisor",
        "Touchless tap and automatic soap dispenser"
      ],
      notes: "Cleaned and sanitized hourly."
    },
    {
      id: "LOC-1-WATER1",
      code: "DW-02",
      name: "Filtered Drinking Water Point (Floor 1)",
      category: "water",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93478, 77.53535],
      accessibilityRating: "Accessible Height",
      heightCm: 80,
      stepFree: true,
      features: [
        "Dual height nozzles (standard 100cm & lowered 80cm)",
        "Wheelchair approachable knee space",
        "Push-bar trigger requiring <22 Newtons force"
      ],
      notes: "Located next to central staircase landing."
    },
    {
      id: "LOC-1-SEAT1",
      code: "REST-02",
      name: "Floor 1 Corridor Rest Bench",
      category: "seating",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93510, 77.53535],
      accessibilityRating: "Comfort Rest Stop",
      stepFree: true,
      features: [
        "Wide cushioned seating with armrest assist",
        "Natural daylight reading area"
      ],
      notes: "Located midway along the Computer Science / ISE corridor."
    },
    {
      id: "LOC-1-STAIRS1",
      code: "ST-01",
      name: "Main Staircase (Floor 1 Landing)",
      category: "stairs",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93488, 77.53520],
      accessibilityRating: "NOT Wheelchair Accessible",
      stepCount: 22,
      stepFree: false,
      features: [
        "Stairway to Ground or 2nd floor",
        "Yellow step nosings with non-slip texture"
      ],
      notes: "⚠️ Flight of stairs. Use Lift L-01 for step-free travel."
    },
    {
      id: "LOC-1-EMERG1",
      code: "REFUGE-01",
      name: "Floor 1 Fire Refuge Area & Evac-Chair",
      category: "emergency",
      buildingId: "block-a",
      floorId: "L1",
      coords: [12.93520, 77.53485],
      accessibilityRating: "Designated Safe Refuge",
      stepFree: true,
      features: [
        "60-minute fire-rated compartment",
        "Wall-mounted Evac+Chair emergency descent chair for mobility-impaired individuals",
        "Direct two-way voice intercom with campus fire marshals"
      ],
      notes: "Designated waiting zone for wheelchair users during a fire evacuation."
    },

    // ==========================================
    // SECOND FLOOR (L2) LOCATIONS
    // ==========================================
    {
      id: "LOC-2-01",
      code: "301",
      name: "AI & Cloud Computing Research Lab",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93505, 77.53500],
      accessibilityRating: "Fully Accessible",
      doorWidthCm: 96,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Wide wheelchair-accessible work bays",
        "Height-adjustable workstations",
        "Voice-activated developer development tooling setup"
      ],
      notes: "High-performance lab for 3rd and 4th year projects.",
      contact: "Research Lab Head: Ext 401"
    },
    {
      id: "LOC-2-02",
      code: "302",
      name: "Department Digital Library & Reading Room",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93465, 77.53500],
      accessibilityRating: "Universal Library Access",
      doorWidthCm: 105,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Lowered book return counter and self-checkout kiosk (78cm)",
        "Screen reader workstations (JAWS & NVDA) with Braille displays",
        "Audiobook repository with noise-canceling headphones",
        "Quiet sensory room for neurodivergent students"
      ],
      notes: "All book stacks have a minimum clearance of 110cm for easy wheelchair navigation.",
      contact: "Librarian: Ext 402"
    },
    {
      id: "LOC-2-03",
      code: "303",
      name: "LH-301: Final Year ISE Lecture Hall",
      category: "classrooms",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93450, 77.53545],
      accessibilityRating: "Flat-Floor Accessible",
      doorWidthCm: 95,
      threshold: "Level (0 cm)",
      stepFree: true,
      features: [
        "Single-level floor with movable ergonomic chairs",
        "Wide front turning radius (180cm)",
        "Overhead anti-glare daylight dimmers"
      ],
      notes: "Modern flexible layout adaptable for wheelchair configurations.",
      contact: "Faculty: Ext 403"
    },
    {
      id: "LOC-2-LIFT1",
      code: "L-01",
      name: "Floor 2 Landing - Main Atrium Lift",
      category: "lifts",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93485, 77.53530],
      accessibilityRating: "Universal Wheelchair Access",
      doorWidthCm: 110,
      stepFree: true,
      features: [
        "Voice announcement: 'Second Floor - Department Library & Research Labs'",
        "Embossed Braille floor plates on outer door frames"
      ],
      notes: "Uppermost stop for Main Atrium Lift."
    },
    {
      id: "LOC-2-LIFT2",
      code: "L-02",
      name: "Floor 2 Landing - East Wing Lift",
      category: "lifts",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93470, 77.53570],
      accessibilityRating: "Accessible Elevator",
      doorWidthCm: 120,
      stepFree: true,
      features: [
        "Direct step-free connection to Floor 2 classrooms"
      ],
      notes: "East Wing access."
    },
    {
      id: "LOC-2-WASH1",
      code: "W-03",
      name: "Accessible Restroom (Floor 2 West)",
      category: "washrooms",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93495, 77.53555],
      accessibilityRating: "Full Universal Standard",
      doorWidthCm: 95,
      stepFree: true,
      features: [
        "Motorized push-button automatic sliding door",
        "Dual support grab bars, emergency pull cord",
        "Lowered sink with thermal mixing valve (anti-scalding)"
      ],
      notes: "Accessible to all students and staff."
    },
    {
      id: "LOC-2-WATER1",
      code: "DW-03",
      name: "Water Dispenser Station (Floor 2)",
      category: "water",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93478, 77.53535],
      accessibilityRating: "Accessible Height",
      heightCm: 79,
      stepFree: true,
      features: [
        "Sensor-activated hands-free spout",
        "Clear foot & knee clearance space"
      ],
      notes: "Filter replaced bi-weekly."
    },
    {
      id: "LOC-2-SEAT1",
      code: "REST-03",
      name: "Study Nook & Quiet Terrace Seating",
      category: "seating",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93510, 77.53540],
      accessibilityRating: "Quiet Space",
      stepFree: true,
      features: [
        "Ergonomic seating with laptop charging ports",
        "Low ambient noise zone (under 45dB)"
      ],
      notes: "Ideal for individual study or reading."
    },
    {
      id: "LOC-2-STAIRS1",
      code: "ST-01",
      name: "Main Staircase (Floor 2 Landing)",
      category: "stairs",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93488, 77.53520],
      accessibilityRating: "NOT Wheelchair Accessible",
      stepCount: 22,
      stepFree: false,
      features: [
        "Stair flight down to Floor 1 and Ground Floor"
      ],
      notes: "⚠️ Use Lift L-01 for step-free descent."
    },
    {
      id: "LOC-2-EMERG1",
      code: "REFUGE-02",
      name: "Floor 2 Fire Refuge Area & Evac-Chair",
      category: "emergency",
      buildingId: "block-a",
      floorId: "L2",
      coords: [12.93520, 77.53485],
      accessibilityRating: "Designated Safe Refuge",
      stepFree: true,
      features: [
        "Fire-rated smoke barrier",
        "Emergency evacuation tracked stair chair",
        "Emergency intercom to central control room"
      ],
      notes: "Muster point for mobility assistance in fire drills or emergencies."
    },

    // ==========================================
    // OUTDOOR CAMPUS WAYPOINTS
    // ==========================================
    {
      id: "LOC-CAMPUS-GATE",
      code: "GATE-01",
      name: "Main Campus Entrance & Accessible Drop-off Bay",
      category: "ramps",
      buildingId: "outdoor",
      floorId: "L0",
      coords: [12.93560, 77.53530],
      accessibilityRating: "Fully Accessible",
      stepFree: true,
      features: [
        "Zero-curb drop-off zone with tactile paving",
        "Paved smooth walkway (width 220cm) directly to Academic Block North Ramp",
        "Security guard cabin with wheelchair loan service"
      ],
      notes: "Primary accessible entry point for cabs, accessible vans, and campus shuttle.",
      contact: "Security Gate: Ext 100"
    },
    {
      id: "LOC-CAMPUS-PARK",
      code: "PARK-01",
      name: "Designated Accessible Parking Bays (4 slots)",
      category: "ramps",
      buildingId: "outdoor",
      floorId: "L0",
      coords: [12.93480, 77.53630],
      accessibilityRating: "Fully Accessible Parking",
      stepFree: true,
      features: [
        "4 wide stalls (360cm width with 120cm transfer aisle)",
        "Direct connection to East Ramp R-02 without crossing vehicular traffic",
        "Marked with blue universal wheelchair emblem"
      ],
      notes: "Reserved strictly for vehicles with authorized disability permits.",
      contact: "Campus Parking: Ext 105"
    }
  ],

  // Common Starting Points for Route Calculations
  startingPoints: [
    {
      id: "SP-GATE",
      name: "Campus Main Gate & Drop-off Bay",
      coords: [12.93560, 77.53530],
      floorId: "L0",
      description: "Street level taxi / van drop-off with zero-curb transition"
    },
    {
      id: "SP-PARK",
      name: "East Accessible Parking Bay",
      coords: [12.93480, 77.53630],
      floorId: "L0",
      description: "Direct walkway to East Ramp R-02"
    },
    {
      id: "SP-NORTH-RAMP",
      name: "North Main Entrance Ramp (R-01)",
      coords: [12.93527, 77.53530],
      floorId: "L0",
      description: "Ground floor main covered entrance"
    },
    {
      id: "SP-ATRIUM",
      name: "Ground Floor Main Atrium (Near Lift L-01)",
      coords: [12.93485, 77.53530],
      floorId: "L0",
      description: "Inside the building next to passenger elevators"
    }
  ],

  // Sample Community Updates / Bulletin Posts
  communityUpdates: [
    {
      id: "COMM-01",
      author: "Sneha Rao (3rd Sem ISE)",
      role: "Student Disability Representative",
      date: "2026-10-24",
      time: "14:30",
      badge: "Verified Update",
      category: "maintenance",
      title: "Main Atrium Lift L-01 routine servicing completed",
      content: "The monthly maintenance check for Lift L-01 was completed this morning. Voice announcements and door safety sensors are working smoothly.",
      helpfulCount: 28,
      status: "active"
    },
    {
      id: "COMM-02",
      author: "Rahul Sharma (1st Sem ISE)",
      role: "Student",
      date: "2026-10-23",
      time: "11:15",
      badge: "Path Alert",
      category: "path-alert",
      title: "Temporary construction scaffolding near South Courtyard",
      content: "Gardening work underway near the South stairs. Wheelchair users should please use the North Ramp R-01 or East Ramp R-02 to avoid dust and obstacles.",
      helpfulCount: 19,
      status: "active"
    },
    {
      id: "COMM-03",
      author: "Dr. K. N. Ramesh",
      role: "Faculty Coordinator, ISE Dept",
      date: "2026-10-20",
      time: "09:00",
      badge: "Resource Info",
      category: "resource",
      title: "Tactile keycaps and screen magnifier available in Lab 1",
      content: "Lab 1 (Room 201, Floor 1) now has NVDA screen reading and oversized contrast keycaps ready at Workstation 1 and 2 for all programming sessions.",
      helpfulCount: 34,
      status: "active"
    },
    {
      id: "COMM-04",
      author: "Campus Facilities Desk",
      role: "Administration",
      date: "2026-10-18",
      time: "16:45",
      badge: "Facility Upgrade",
      category: "facility",
      title: "Automatic sliding sensor added to 2nd Floor Accessible Washroom",
      content: "Washroom W-03 on the 2nd Floor now has a touchless sensor door button to assist users with limited hand mobility.",
      helpfulCount: 42,
      status: "active"
    }
  ],

  // Sample User Reported Issues (Pre-seeded for demonstration)
  sampleReports: [
    {
      id: "REP-01",
      issueType: "Minor Obstacle",
      building: "Main Academic Block (MAB)",
      floor: "Ground Floor (L0)",
      locationName: "Corridor near Lab 102",
      description: "A temporary display board was partially obstructing the 120cm clear corridor path.",
      severity: "Low",
      status: "Resolved",
      submittedAt: "2026-10-22",
      resolutionNote: "Security moved the board against the wall to restore full clearance."
    },
    {
      id: "REP-02",
      issueType: "Lighting / Visibility",
      building: "Main Academic Block (MAB)",
      floor: "First Floor (L1)",
      locationName: "East Ramp landing junction",
      description: "One overhead LED tube light was flickering near the ramp sign.",
      severity: "Medium",
      status: "In Progress",
      submittedAt: "2026-10-24",
      resolutionNote: "Electrician assigned; replacement bulb scheduled today."
    }
  ]
};

// Expose on global window object for clean modular access
if (typeof window !== "undefined") {
  window.CAMPUS_DATA = CAMPUS_DATA;
}
