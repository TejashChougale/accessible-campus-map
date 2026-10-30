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
    this.lastFocusedElement = document.activeElement;
    const modal = document.getElementById("reportIssueModal");
    const form = document.getElementById("reportIssueForm");
    if (!modal || !form) return;

    form.reset();
    this.clearErrors();

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

    // Attach focus trap & Escape key handler
    this._modalKeyDownHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeModal();
        return;
      }

      if (e.key === "Tab") {
        const focusables = Array.from(modal.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    modal.addEventListener("keydown", this._modalKeyDownHandler);

    // Initial focus on first input
    const firstFocusable = modal.querySelector("select, input, textarea, button");
    if (firstFocusable) firstFocusable.focus();
  }

  closeModal() {
    const modal = document.getElementById("reportIssueModal");
    if (!modal) return;

    if (this._modalKeyDownHandler) {
      modal.removeEventListener("keydown", this._modalKeyDownHandler);
      this._modalKeyDownHandler = null;
    }

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    this.clearErrors();

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === "function") {
      this.lastFocusedElement.focus();
    }
  }

  clearErrors() {
    const errorBanner = document.getElementById("reportFormErrorBanner");
    if (errorBanner) {
      errorBanner.style.display = "none";
      errorBanner.innerHTML = "";
    }
    const form = document.getElementById("reportIssueForm");
    if (form) {
      form.querySelectorAll("[aria-invalid='true']").forEach(el => {
        el.removeAttribute("aria-invalid");
      });
    }
  }

  showError(message, targetElement = null) {
    let errorBanner = document.getElementById("reportFormErrorBanner");
    const form = document.getElementById("reportIssueForm");
    if (!errorBanner && form) {
      errorBanner = document.createElement("div");
      errorBanner.id = "reportFormErrorBanner";
      errorBanner.className = "form-error-banner";
      errorBanner.setAttribute("role", "alert");
      form.insertBefore(errorBanner, form.firstChild);
    }

    if (errorBanner) {
      errorBanner.innerHTML = `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>${this.escapeHtml(message)}</span>`;
      errorBanner.style.display = "flex";
    }

    if (targetElement) {
      targetElement.setAttribute("aria-invalid", "true");
      targetElement.focus();
    }
  }

  /**
   * Handles submission of the report issue form
   */
  handleSubmit(e) {
    e.preventDefault();
    this.clearErrors();

    const form = e.target;
    const issueType = form.issueType ? form.issueType.value : "General Issue";
    const buildingId = form.buildingSelect ? form.buildingSelect.value : "block-a";
    const floorId = form.floorSelect ? form.floorSelect.value : "L0";
    const locationName = form.locationName ? form.locationName.value.trim() : "Unspecified";
    const description = form.description ? form.description.value.trim() : "";
    const severitySelect = form.severity;
    const severity = severitySelect ? severitySelect.value : "";
    const reporterName = form.reporterName ? form.reporterName.value.trim() : "";
    const reporterRole = form.reporterRole ? form.reporterRole.value : "Student";
    const contact = form.reporterContact ? form.reporterContact.value.trim() : "";

    if (!severity || severity === "") {
      this.showError("Please select an issue severity level (Low, Medium, or Urgent).", severitySelect);
      return;
    }

    if (!description) {
      this.showError("Please provide a brief description of the issue or suggested correction.", form.description);
      return;
    }

    const finalReporterName = reporterName || `Anonymous ${reporterRole}`;

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
      reporterName: finalReporterName,
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

    // Show toast notification specifying local prototype storage
    this.showToast(`Report ${newId} saved locally in prototype storage. Thank you for contributing!`);

    // Refresh reports list view
    this.renderReportsList();
  }

  getFloorLabel(floorId) {
    if (floorId === "L0") return "Ground Floor (L0)";
    if (floorId === "L1") return "First Floor (L1)";
    if (floorId === "L2") return "Second Floor (L2)";
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

  showToast(message, isError = false) {
    const toast = document.getElementById("campusToast");
    if (!toast) return;

    const msgEl = toast.querySelector(".toast-message");
    if (msgEl) msgEl.textContent = message;

    const iconEl = toast.querySelector(".toast-icon i");
    if (iconEl) {
      if (isError) {
        iconEl.className = "fa-solid fa-circle-exclamation";
      } else {
        iconEl.className = "fa-solid fa-check";
      }
    }

    toast.classList.toggle("toast-error", Boolean(isError));
    toast.classList.add("show");

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.remove("toast-error");
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
