/* ScratchArena — dashboard page logic */

(function () {
  SA.mountNavbar("dashboard");
  SA.mountFooter();

  const heroLogo = document.getElementById("hero-logo");
  if (heroLogo) heroLogo.innerHTML = SA.logoSVG(88);

  const statsGrid = document.getElementById("stats-grid");
  const stats = [
    { label: "Active Arenas", value: String(SA_LEVELS.length) },
    { label: "Competitors", value: "13,430" },
    { label: "Runs Graded Today", value: "2,918" },
    { label: "Your Rank", value: "#248", accent: true },
  ];
  statsGrid.innerHTML = stats
    .map(
      (s) => `
        <div>
          <div class="stat-value font-display${s.accent ? " accent" : ""}">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `
    )
    .join("");

  const grid = document.getElementById("level-grid");
  grid.innerHTML = SA_LEVELS.map((level, i) => {
    const pct = Math.round((level.highScore / level.maxScore) * 100);
    return `
      <a href="arena.html?level=${level.id}" class="level-card clip-card" style="animation-delay:${i * 0.07}s;">
        <div class="level-thumb sa-scanlines" style="background:linear-gradient(135deg, ${level.thumbGradient[0]}, ${level.thumbGradient[1]});">
          <div style="position:absolute; top:12px; left:12px;">${SA.difficultyBadgeHTML(level.difficulty)}</div>
          <span class="level-tag">${level.category}</span>
          <span class="level-tag">${level.playerCount.toLocaleString()} plays</span>
        </div>
        <div class="level-body">
          <div>
            <h3 class="level-name font-display">${SA.escapeHTML(level.name)}</h3>
            <p class="level-tagline">${SA.escapeHTML(level.tagline)}</p>
          </div>
          <div class="level-score-row">
            <span class="level-score-label">Your High Score</span>
            <span class="level-score-value font-display">${level.highScore.toLocaleString()}<span class="max">/${level.maxScore.toLocaleString()}</span></span>
          </div>
          <div class="score-bar-track">
            <div class="score-bar-fill" data-pct="${pct}"></div>
          </div>
          <div class="level-footer">
            <span class="level-footer-hint">Tap to enter arena</span>
            <span class="level-footer-arrow">&rsaquo;&rsaquo;</span>
          </div>
        </div>
      </a>
    `;
  }).join("");

  // animate score bars in after mount
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      grid.querySelectorAll(".score-bar-fill").forEach((el) => {
        el.style.width = el.dataset.pct + "%";
      });
    });
  });
})();
