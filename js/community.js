/**
 * ACCESSIBLE CAMPUS MAP - COMMUNITY BULLETIN & ACCESSIBILITY UPDATES
 * 
 * Allows students, faculty, and peer volunteers to share crowdsourced
 * accessibility tips, obstacle alerts, elevator status, and study advice.
 * Persists updates and "Helpful" upvotes in browser localStorage.
 */

class CampusCommunityFeed {
  constructor(data) {
    this.data = data;
    this.storageKey = "accessible_campus_community_posts";
    this.upvotesStorageKey = "accessible_campus_user_upvotes";
    this.posts = [];
    this.userUpvotes = new Set();
    this.currentCategory = "all";

    this.loadPosts();
  }

  loadPosts() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.posts = JSON.parse(stored);
      } else {
        this.posts = [...(this.data.communityUpdates || [])];
        this.savePosts();
      }

      const storedVotes = localStorage.getItem(this.upvotesStorageKey);
      if (storedVotes) {
        this.userUpvotes = new Set(JSON.parse(storedVotes));
      }
    } catch (e) {
      console.warn("LocalStorage unavailable, using default posts:", e);
      this.posts = [...(this.data.communityUpdates || [])];
    }
  }

  savePosts() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
    } catch (e) {
      console.warn("Could not save community posts:", e);
    }
  }

  saveUpvotes() {
    try {
      localStorage.setItem(this.upvotesStorageKey, JSON.stringify(Array.from(this.userUpvotes)));
    } catch (e) {
      console.warn("Could not save upvotes:", e);
    }
  }

  openNewPostModal() {
    this.lastFocusedElement = document.activeElement;
    const modal = document.getElementById("newCommunityPostModal");
    const form = document.getElementById("newCommunityPostForm");
    if (!modal || !form) return;

    form.reset();
    this.clearErrors();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    // Attach focus trap & Escape key handler
    this._modalKeyDownHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeNewPostModal();
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

    const first = modal.querySelector("input, select, textarea, button");
    if (first) first.focus();
  }

  closeNewPostModal() {
    const modal = document.getElementById("newCommunityPostModal");
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
    const errorBanner = document.getElementById("communityFormErrorBanner");
    if (errorBanner) {
      errorBanner.style.display = "none";
      errorBanner.innerHTML = "";
    }
    const form = document.getElementById("newCommunityPostForm");
    if (form) {
      form.querySelectorAll("[aria-invalid='true']").forEach(el => {
        el.removeAttribute("aria-invalid");
      });
    }
  }

  showError(message, targetElement = null) {
    let errorBanner = document.getElementById("communityFormErrorBanner");
    const form = document.getElementById("newCommunityPostForm");
    if (!errorBanner && form) {
      errorBanner = document.createElement("div");
      errorBanner.id = "communityFormErrorBanner";
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

  handlePostSubmit(e) {
    e.preventDefault();
    this.clearErrors();

    const form = e.target;
    const author = form.postAuthor ? form.postAuthor.value.trim() : "";
    const role = form.postRole ? form.postRole.value : "Student";
    const category = form.postCategory ? form.postCategory.value : "path-alert";
    const title = form.postTitle ? form.postTitle.value.trim() : "";
    const content = form.postContent ? form.postContent.value.trim() : "";

    if (!title) {
      this.showError("Please enter a headline or title for your accessibility update.", form.postTitle);
      return;
    }

    if (!content) {
      this.showError("Please provide details or advice for your community update.", form.postContent);
      return;
    }

    const finalAuthor = author || "Campus Member";

    const newPost = {
      id: `COMM-${Date.now()}`,
      author: finalAuthor,
      role: role,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge: "Community Tip",
      category: category,
      title: title,
      content: content,
      helpfulCount: 0,
      status: "active"
    };

    this.posts.unshift(newPost);
    this.savePosts();
    this.closeNewPostModal();

    if (window.CampusApp && window.CampusApp.reports) {
      window.CampusApp.reports.showToast("Your community update has been saved locally in prototype storage! Thank you for sharing.");
    }

    this.renderFeed();
  }

  toggleHelpful(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (this.userUpvotes.has(postId)) {
      post.helpfulCount = Math.max(0, post.helpfulCount - 1);
      this.userUpvotes.delete(postId);
    } else {
      post.helpfulCount = (post.helpfulCount || 0) + 1;
      this.userUpvotes.add(postId);
    }

    this.savePosts();
    this.saveUpvotes();
    this.renderFeed();
  }

  filterCategory(cat) {
    this.currentCategory = cat;
    this.renderFeed();
  }

  renderFeed(containerId = "communityFeedContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtered = this.posts;
    if (this.currentCategory !== "all") {
      filtered = this.posts.filter(p => p.category === this.currentCategory);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="community-empty">
          <i class="fa-solid fa-bullhorn"></i>
          <p>No community updates under this filter yet.</p>
          <button class="btn-primary btn-sm" onclick="window.CampusApp.community.openNewPostModal()">
            <i class="fa-solid fa-plus"></i> Post the First Tip
          </button>
        </div>
      `;
      return;
    }

    let html = `<div class="community-posts-list">`;

    filtered.forEach(post => {
      const hasUpvoted = this.userUpvotes.has(post.id);

      let catBadgeClass = "cat-path";
      let catIcon = "fa-triangle-exclamation";
      let catLabel = "Path Alert";

      if (post.category === "maintenance") {
        catBadgeClass = "cat-maint";
        catIcon = "fa-wrench";
        catLabel = "Maintenance";
      } else if (post.category === "facility") {
        catBadgeClass = "cat-facility";
        catIcon = "fa-circle-check";
        catLabel = "Facility Upgrade";
      } else if (post.category === "resource") {
        catBadgeClass = "cat-resource";
        catIcon = "fa-book-open-reader";
        catLabel = "Study Resource";
      }

      html += `
        <article class="community-post-card">
          <div class="post-card-header">
            <div class="post-author-row">
              <div class="author-avatar">
                <i class="fa-solid fa-user"></i>
              </div>
              <div class="author-meta">
                <span class="author-name">${this.escapeHtml(post.author)}</span>
                <span class="author-role">${this.escapeHtml(post.role)}</span>
              </div>
            </div>
            <span class="post-cat-badge ${catBadgeClass}">
              <i class="fa-solid ${catIcon}"></i> ${catLabel}
            </span>
          </div>

          <h4 class="post-title">${this.escapeHtml(post.title)}</h4>
          <p class="post-body">${this.escapeHtml(post.content)}</p>

          <div class="post-footer">
            <span class="post-time">
              <i class="fa-regular fa-clock"></i> ${post.date} ${post.time ? '· ' + post.time : ''}
            </span>

            <button type="button" 
                    class="btn-helpful ${hasUpvoted ? 'active' : ''}" 
                    onclick="window.CampusApp.community.toggleHelpful('${post.id}')"
                    aria-label="Mark update as helpful. Current count: ${post.helpfulCount}">
              <i class="fa-${hasUpvoted ? 'solid' : 'regular'} fa-thumbs-up"></i>
              <span>Helpful (${post.helpfulCount})</span>
            </button>
          </div>
        </article>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
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
  window.CampusCommunityFeed = CampusCommunityFeed;
}
