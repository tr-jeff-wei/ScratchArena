/* ScratchArena — shared UI component renderers (plain JS, no framework). */

const SA = {};

SA.escapeHTML = function (str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
};

SA.formatDate = function (iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

SA.logoSVG = function (size) {
  size = size || 40;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="sa-shield-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--sa-orange-300)" />
          <stop offset="100%" stop-color="var(--sa-orange-600)" />
        </linearGradient>
        <linearGradient id="sa-shield-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--sa-ice-100)" />
          <stop offset="100%" stop-color="var(--sa-steel-500)" />
        </linearGradient>
        <filter id="sa-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M38 8 L32 8 L28 12 L28 18 L32 22 L38 22" fill="none" stroke="var(--sa-orange-400)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M62 8 L68 8 L72 12 L72 18 L68 22 L62 22" fill="none" stroke="var(--sa-steel-300)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M50 6 L52.3 12.5 L59 13.5 L54 18 L55.3 24.5 L50 21 L44.7 24.5 L46 18 L41 13.5 L47.7 12.5 Z" fill="var(--sa-orange-300)" filter="url(#sa-glow)" />
      <path d="M50 26 L84 36 L84 58 C84 76 68 88 50 94 C32 88 16 76 16 58 L16 36 Z" fill="none" stroke="var(--sa-orange-400)" stroke-width="3" filter="url(#sa-glow)" />
      <path d="M50 30 L50 90 C34.5 84.5 20 73 20 58 L20 38 Z" fill="url(#sa-shield-orange)" opacity="0.92" />
      <path d="M50 30 L50 90 C65.5 84.5 80 73 80 58 L80 38 Z" fill="url(#sa-shield-steel)" opacity="0.85" />
      <text x="34" y="66" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="30" fill="var(--sa-navy-900)">S</text>
      <text x="66" y="66" text-anchor="middle" font-family="var(--font-display)" font-weight="700" font-size="30" fill="var(--sa-navy-900)">A</text>
    </svg>
  `;
};

SA.wordmarkHTML = function () {
  return `
    <div>
      <span class="wordmark"><span class="grad-text-orange">Scratch</span><span class="grad-text-steel">Arena</span></span>
    </div>
  `;
};

/** Mounts the shared navbar. No account/login UI — this is a static prototype. */
SA.mountNavbar = function (activePage) {
  const root = document.getElementById("navbar-root");
  if (!root) return;
  const links = [
    { href: "index.html", label: "Dashboard", key: "dashboard" },
    { href: "arena.html?level=1", label: "Arena", key: "arena" },
    { href: "rankings.html", label: "Rankings", key: "rankings" },
  ];
  const linksHTML = links
    .map(
      (l) =>
        `<a class="nav-link${l.key === activePage ? " active" : ""}" href="${l.href}">${l.label}</a>`
    )
    .join("");

  root.innerHTML = `
    <header class="navbar">
      <nav class="container navbar-inner">
        <a href="index.html" class="brand">
          ${SA.logoSVG(36)}
          ${SA.wordmarkHTML()}
        </a>
        <div class="nav-links">${linksHTML}</div>
      </nav>
    </header>
  `;
};

SA.mountFooter = function () {
  const root = document.getElementById("footer-root");
  if (!root) return;
  root.innerHTML = `
    <footer class="footer">ScratchArena — prototype build. All player data shown is placeholder.</footer>
  `;
};

SA.difficultyBadgeHTML = function (difficulty) {
  const meta = {
    rookie: { label: "Rookie", cls: "badge-rookie" },
    skilled: { label: "Skilled", cls: "badge-skilled" },
    expert: { label: "Expert", cls: "badge-expert" },
    legendary: { label: "Legendary", cls: "badge-legendary" },
  }[difficulty];
  return `<span class="badge-difficulty ${meta.cls}"><span class="badge-dot" style="background:currentColor;box-shadow:0 0 6px currentColor;"></span>${meta.label}</span>`;
};

const SA_RANK_CLASS = { 1: "rank-1", 2: "rank-2", 3: "rank-3" };

SA.leaderboardRowHTML = function (entry) {
  const rankCls = SA_RANK_CLASS[entry.rank] || "";
  return `
    <div class="leaderboard-row${entry.isCurrentUser ? " current-user" : rankCls ? " rank-glow" : ""}${entry.justUpdated ? " just-updated" : ""}" data-entry-id="${entry.id}">
      <div class="rank-badge ${rankCls}">${entry.rank}</div>
      <div class="leaderboard-player">
        <div class="player-row">
          <span class="player-name${entry.isCurrentUser ? " is-user" : ""}">${SA.escapeHTML(entry.playerName)}</span>
          ${entry.isCurrentUser ? '<span class="tag-you">You</span>' : ""}
          ${!entry.passedValidation ? '<span class="tag-failed">Failed</span>' : ""}
        </div>
        <span class="player-date">${SA.formatDate(entry.updatedAt)}</span>
      </div>
      <div class="player-score">${entry.score.toLocaleString()}</div>
    </div>
  `;
};

/**
 * Mounts a self-contained, interactive leaderboard into `container` for the
 * given `levelId`, seeded with `initialEntries`. Wires the "Simulate
 * Extension Submission" button to the mock flow in extensionApi.js.
 */
SA.mountLeaderboard = function (container, levelId, initialEntries) {
  let entries = initialEntries;
  let isSyncing = false;

  function render() {
    container.innerHTML = `
      <div class="leaderboard glow-border clip-panel">
        <div class="leaderboard-header">
          <div class="leaderboard-title">
            <span class="leaderboard-dot"></span>
            <h3 class="leaderboard-heading">Live Leaderboard</h3>
          </div>
          <button class="btn-accent clip-btn" id="sa-simulate-btn" ${isSyncing ? "disabled" : ""}>
            ${isSyncing ? "Validating&hellip;" : "Simulate Extension Submission"}
          </button>
        </div>
        <div class="leaderboard-rows">
          ${entries.map(SA.leaderboardRowHTML).join("")}
        </div>
      </div>
    `;

    const btn = container.querySelector("#sa-simulate-btn");
    if (btn) {
      btn.addEventListener("click", handleSimulate);
    }
  }

  async function handleSimulate() {
    isSyncing = true;
    render();

    const you = entries.find((e) => e.isCurrentUser);
    const bump = 80 + Math.round(Math.random() * 260);
    const payload = {
      playerName: you ? you.playerName : "You",
      levelId: levelId,
      score: (you ? you.score : 0) + bump,
      passedValidation: Math.random() > 0.15,
    };

    const validated = await saMockReceiveExtensionScore(payload);
    entries = saApplyScoreToLeaderboard(entries, validated);
    isSyncing = false;
    render();
  }

  render();
};
