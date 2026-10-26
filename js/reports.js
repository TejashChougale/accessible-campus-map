/**
 * ACCESSIBLE CAMPUS MAP - ISSUE REPORTING & MAP CORRECTIONS MODULE
 * 
 * Allows students and visitors to report accessibility barriers (blocked ramps,
 * broken elevators, missing signage) and propose map corrections.
 * Persists reports in browser localStorage with status tracking.
 */

class CampusReportsManager {
  constructor(data) {
    this.data = data;
    this.storageKey = "accessible_campus_user_reports";
    this.reports = [];
    this.loadReports();
  }

  /**
   * Loads initial reports from localStorage or fallback to sample seed data
   */
  loadReports() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.reports = JSON.parse(stored);
      } else {
        // Seed with sample reports from data.js
        this.reports = [...(this.data.sampleReports || [])];
        this.saveReports();
      }
    } catch (e) {
      console.warn("Could not read localStorage for reports, using memory store:", e);
      this.reports = [...(this.data.sampleReports || [])];
    }
  }

  saveReports() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.reports));
    } catch (e) {
      console.warn("Could not write to localStorage:", e);
    }
  }

  /**
   * Opens the report modal and optionally pre-fills location data
   */
  openModal(prefillLocation = null) {
    const modal = document.getElementById("reportIssueModal");
    const form = document.getElementById("reportIssueForm");
    if (!modal || !form) return;

    form.reset();

    if (prefillLocation) {
      const locInput = document.getElementById("reportLocationInput");
      const floorInput = document.getElementById("reportFloorSelect");
      const buildingInput = document.getElementById("reportBuildingSelect");

      if (locInput) locInput.value = `${prefillLocation.name} (${prefillLocation.code || ''})`;
      if (floorInput && prefillLocation.floorId) floorInput.value = prefillLocation.floorId;
      if (buildingInput && prefillLocation.buildingId) buildingInput.value = prefillLocation.buildingId;
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    // Trap focus inside modal
    const firstFocusable = modal.querySelector("input, select, textarea, button");
    if (firstFocusable) firstFocusable.focus();
  }

  closeModal() {
    const modal = document.getElementById("reportIssueModal");
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  /**
   * Handles submission of the report issue form
   */
  handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const issueType = form.issueType ? form.issueType.value : "General Issue";
    const buildingId = form.buildingSelect ? form.buildingSelect.value : "block-a";
    const floorId = form.floorSelect ? form.floorSelect.value : "L0";
    const locationName = form.locationName ? form.locationName.value.trim() : "Unspecified";
    const description = form.description ? form.description.value.trim() : "";
    const severity = form.severity ? form.severity.value : "Medium";
    const reporterName = form.reporterName ? form.reporterName.value.trim() : "Anonymous Student";
    const reporterRole = form.reporterRole ? form.reporterRole.value : "Student";
    const contact = form.reporterContact ? form.reporterContact.value.trim() : "";

    if (!description) {
      alert("Please provide a brief description of the issue or suggested correction.");
      return;
    }

    // Generate new ticket
    const newId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport = {
      id: newId,
      issueType,
      building: buildingId === "block-a" ? "Main Academic Block (MAB)" : "Outdoor Campus Pathway",
      floor: this.getFloorLabel(floorId),
      locationName: locationName || "General Area",
      description,
      severity,
      reporterName: reporterName || "Anonymous",
      reporterRole,
      contact,
      status: "Reported",
      submittedAt: new Date().toISOString().split("T")[0],
      resolutionNote: "Under review by Student Disability & Campus Facilities Cell."
    };

    // Add to top of reports
    this.reports.unshift(newReport);
    this.saveReports();

    // Close modal
    this.closeModal();

    // Show toast notification
    this.showToast(`Issue ${newId} submitted successfully! Thank you for helping keep campus accessible.`);

    // Refresh reports list view
    this.renderReportsList();
  }

  getFloorLabel(floorId) {
    if (floorId === "L0") return "Ground Floor";
    if (floorId === "L1") return "Floor 1";
    if (floorId === "L2") return "Floor 2";
    return floorId;
  }

  /**
   * Renders the list of active/resolved accessibility reports
   */
  renderReportsList(containerId = "reportsListContainer", filterStatus = "all") {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtered = this.reports;
    if (filterStatus !== "all") {
      filtered = this.reports.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="reports-empty-state">
          <i class="fa-solid fa-clipboard-check"></i>
          <p>No accessibility issues reported under this category.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="reports-grid">`;

    filtered.forEach(rep => {
      const isResolved = rep.status.toLowerCase() === "resolved";
      const isInProgress = rep.status.toLowerCase() === "in progress";

      let statusBadgeClass = "badge-reported";
      let statusIcon = "fa-clock";
      if (isResolved) {
        statusBadgeClass = "badge-resolved";
        statusIcon = "fa-circle-check";
      } else if (isInProgress) {
        statusBadgeClass = "badge-progress";
        statusIcon = "fa-screwdriver-wrench";
      }

      let severityClass = "sev-low";
      if (rep.severity.toLowerCase() === "urgent" || rep.severity.toLowerCase() === "high") {
        severityClass = "sev-urgent";
      } else if (rep.severity.toLowerCase() === "medium") {
        severityClass = "sev-medium";
      }

      html += `
        <div class="report-card">
          <div class="report-card-top">
            <span class="report-id">${rep.id}</span>
            <div class="report-tags">
              <span class="report-sev ${severityClass}">${rep.severity} Severity</span>
              <span class="report-status ${statusBadgeClass}">
                <i class="fa-solid ${statusIcon}"></i> ${rep.status}
              </span>
            </div>
          </div>

          <h4 class="report-title">${this.escapeHtml(rep.issueType)} - ${this.escapeHtml(rep.locationName)}</h4>
          <div class="report-location-meta">
            <span><i class="fa-solid fa-building"></i> ${rep.building}</span>
            <span><i class="fa-solid fa-layer-group"></i> ${rep.floor}</span>
            <span><i class="fa-regular fa-calendar"></i> ${rep.submittedAt}</span>
          </div>

          <p class="report-desc">${this.escapeHtml(rep.description)}</p>

          ${rep.resolutionNote ? `
            <div class="report-resolution-box">
              <strong><i class="fa-solid fa-comment-dots"></i> Facilities Update:</strong>
              <span>${this.escapeHtml(rep.resolutionNote)}</span>
            </div>
          ` : ''}
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  showToast(message) {
    const toast = document.getElementById("campusToast");
    if (!toast) return;

    toast.querySelector(".toast-message").textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4500);
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
  window.CampusReportsManager = CampusReportsManager;
}
