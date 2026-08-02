/* ScratchArena — arena page logic */

(function () {
  SA.mountNavbar("arena");
  SA.mountFooter();

  const params = new URLSearchParams(window.location.search);
  const levelId = params.get("level") || "1";
  const level = saGetLevel(levelId);

  const headerRoot = document.getElementById("arena-header");
  const viewerRoot = document.getElementById("viewer-root");
  const instructionsRoot = document.getElementById("instructions-root");
  const leaderboardRoot = document.getElementById("leaderboard-root");

  if (!level) {
    document.title = "Arena not found — ScratchArena";
    headerRoot.innerHTML = `
      <div class="arena-crumbs">
        <a class="crumb-link" href="index.html">&lsaquo; Dashboard</a>
      </div>
      <h1 class="arena-title">Arena not found</h1>
    `;
    viewerRoot.innerHTML = `<p style="color:var(--sa-mute);">No level matches id "${SA.escapeHTML(levelId)}". Head back to the dashboard and pick a live arena.</p>`;
    instructionsRoot.innerHTML = "";
    leaderboardRoot.innerHTML = "";
    return;
  }

  document.title = `${level.name} — ScratchArena`;

  headerRoot.innerHTML = `
    <div class="arena-crumbs">
      <a class="crumb-link" href="index.html">&lsaquo; Dashboard</a>
      <span class="crumb-sep">/</span>
      <h1 class="arena-title font-display">${SA.escapeHTML(level.name)}</h1>
      ${SA.difficultyBadgeHTML(level.difficulty)}
    </div>
    <div class="arena-meta"><strong>${level.playerCount.toLocaleString()}</strong> competitors have entered this arena</div>
  `;

  // ---- viewer (Scratch project placeholder monitor) ----
  const slug = level.name.toLowerCase().replace(/\s+/g, "-");
  viewerRoot.innerHTML = `
    <div class="viewer glow-border clip-panel">
      <div class="viewer-topbar">
        <div class="viewer-dots" style="display:flex; align-items:center;">
          <span class="viewer-dot" style="background:rgba(255,59,59,0.8);"></span>
          <span class="viewer-dot" style="background:rgba(255,157,46,0.8); margin-left:8px;"></span>
          <span class="viewer-dot" style="background:rgba(126,168,216,0.8); margin-left:8px;"></span>
          <span class="viewer-url">scratcharena.io/embed/${slug}</span>
        </div>
        <div class="viewer-status">
          <span class="status-dot" id="status-dot"></span>
          <span id="status-label">Standby</span>
        </div>
      </div>

      <div class="viewer-viewport sa-scanlines">
        <!--
          REAL INTEGRATION HOOK:
          Replace this placeholder with the actual embedded Scratch project,
          e.g. <iframe src="https://scratch.mit.edu/projects/PROJECT_ID/embed">
          The browser extension will attach to this iframe (or a sibling
          content-script context) to read block state and report scores via
          the mock flow simulated in js/extensionApi.js.
        -->
        <div class="viewer-content">
          <div class="viewer-icon clip-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--sa-orange-400)"><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div>
            <p class="viewer-heading">Scratch Project Viewport</p>
            <p class="viewer-copy">The embedded Scratch editor will render here once project integration is wired up.</p>
          </div>
          <button class="btn-accent clip-btn" id="simulate-load-btn">Simulate Load</button>
        </div>
      </div>

      <div class="viewer-footer">
        <span id="stat-fps">FPS: --</span>
        <span id="stat-blocks">BLOCKS: --</span>
        <span id="stat-latency">LATENCY: --</span>
      </div>
    </div>
  `;

  let isRunning = false;
  const statusDot = document.getElementById("status-dot");
  const statusLabel = document.getElementById("status-label");
  const loadBtn = document.getElementById("simulate-load-btn");
  loadBtn.addEventListener("click", () => {
    isRunning = !isRunning;
    statusDot.classList.toggle("live", isRunning);
    statusLabel.textContent = isRunning ? "Live" : "Standby";
    loadBtn.textContent = isRunning ? "Stop Preview" : "Simulate Load";
    document.getElementById("stat-fps").textContent = "FPS: " + (isRunning ? "30" : "--");
    document.getElementById("stat-blocks").textContent = "BLOCKS: " + (isRunning ? "42" : "--");
    document.getElementById("stat-latency").textContent = "LATENCY: " + (isRunning ? "18ms" : "--");
  });

  // ---- HUD instructions panel ----
  instructionsRoot.innerHTML = `
    <div class="hud-panel glow-border clip-panel">
      <div class="hud-header">
        <span class="hud-dot"></span>
        <h3 class="hud-title">Mission Briefing</h3>
      </div>
      <div class="hud-body">
        <div>
          <p class="hud-label">Objective</p>
          <ul class="hud-list">
            ${level.instructions
              .map(
                (line, i) => `<li><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${SA.escapeHTML(line)}</span></li>`
              )
              .join("")}
          </ul>
        </div>
        <div>
          <p class="hud-label">Editable Blocks</p>
          <div class="block-chips">
            ${level.allowedBlocks.map((b) => `<span class="block-chip">${SA.escapeHTML(b)}</span>`).join("")}
          </div>
        </div>
        <div class="warning-box clip-btn">
          <span style="font-weight:900;">!</span>
          <span>Changing anything outside the editable zone will result in an automatic fail.</span>
        </div>
      </div>
    </div>
  `;

  // ---- leaderboard ----
  SA.mountLeaderboard(leaderboardRoot, level.id, SA_LEADERBOARDS[level.id] || []);
})();
