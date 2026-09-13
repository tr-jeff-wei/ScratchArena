/* ScratchArena — Live Sessions page.
 *
 * Fetches rows from the Supabase `game_sessions` table and renders them as
 * a real-time feed, subscribing to INSERTs so new runs appear live without
 * a page reload.
 *
 * REAL INTEGRATION HOOK: the ScratchArena browser extension (see
 * extensions/scratch-arena/) is expected to INSERT into public.game_sessions
 * once it grades a run. This page just reads that same table — there's no
 * mock layer here, since once Supabase is configured the data is real.
 *
 * NOTE: the realtime subscription below requires the `game_sessions` table
 * to be added to Supabase's `supabase_realtime` publication (Database →
 * Replication in the dashboard). Without that, the initial fetch still
 * works fine — new rows just won't appear until the page is refreshed.
 */

(function () {
  SA.mountNavbar("sessions");
  SA.mountFooter();

  const TABLE = "game_sessions";
  const PAGE_SIZE = 50;
  const feedRoot = document.getElementById("sessions-feed-root");

  function formatTimeTaken(seconds) {
    const n = Number(seconds);
    if (!isFinite(n)) return "--";
    return n >= 60 ? `${Math.floor(n / 60)}m ${Math.round(n % 60)}s` : `${n.toFixed(1)}s`;
  }

  function formatTimestamp(iso) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function sessionRowHTML(row, isNew) {
    const score = Number(row.score) || 0;
    return `
      <div class="session-row${isNew ? " just-updated" : ""}" data-session-id="${SA.escapeHTML(row.id)}">
        <div class="session-player">
          <span class="player-name">${SA.escapeHTML(row.player_id)}</span>
          <span class="player-date">${formatTimestamp(row.created_at)}</span>
        </div>
        <span class="block-chip session-project-chip">${SA.escapeHTML(row.scratch_project_id)}</span>
        <span class="session-time">${formatTimeTaken(row.time_taken_seconds)}</span>
        <div class="player-score">${score.toLocaleString()}</div>
      </div>
    `;
  }

  function shellHTML(bodyHTML) {
    return `
      <div class="leaderboard glow-border clip-panel">
        <div class="leaderboard-header">
          <div class="leaderboard-title">
            <span class="leaderboard-dot" id="sessions-status-dot"></span>
            <h3 class="leaderboard-heading">Live Sessions</h3>
          </div>
          <button class="btn-accent clip-btn" id="sessions-refresh-btn">Refresh</button>
        </div>
        <div class="session-rows" id="sessions-list">${bodyHTML}</div>
      </div>
    `;
  }

  function renderShell(bodyHTML) {
    feedRoot.innerHTML = shellHTML(bodyHTML);
    const btn = document.getElementById("sessions-refresh-btn");
    if (btn) btn.addEventListener("click", loadSessions);
  }

  function renderSkeleton() {
    const skeletonRow = `
      <div class="session-row session-row-skeleton">
        <div class="session-player">
          <span class="skeleton-bar" style="width:110px;"></span>
          <span class="skeleton-bar" style="width:70px; height:10px;"></span>
        </div>
        <span class="skeleton-bar" style="width:90px;"></span>
        <span class="skeleton-bar" style="width:40px;"></span>
        <span class="skeleton-bar" style="width:50px;"></span>
      </div>
    `;
    renderShell(skeletonRow.repeat(6));
  }

  function renderNotConfigured() {
    feedRoot.innerHTML = `
      <div class="warning-box clip-btn" style="align-items:flex-start;">
        <span style="font-weight:900;">!</span>
        <span>
          Supabase isn't connected yet. Add your project URL and anon key to
          <code>js/supabaseConfig.js</code>, then reload this page.
        </span>
      </div>
    `;
  }

  function renderError(message) {
    feedRoot.innerHTML = `
      <div class="warning-box clip-btn" style="align-items:flex-start;">
        <span style="font-weight:900;">!</span>
        <span>Couldn't load game sessions: ${SA.escapeHTML(message)}</span>
      </div>
    `;
  }

  function renderRows(rows) {
    if (!rows.length) {
      renderShell(`<div class="session-empty">No game sessions yet. They'll appear here the moment a player submits a run.</div>`);
      return;
    }
    renderShell(rows.map((r) => sessionRowHTML(r, false)).join(""));
  }

  let sb = null;
  let subscribed = false;

  async function loadSessions() {
    sb = saGetSupabaseClient();
    if (!sb) {
      renderNotConfigured();
      return;
    }

    renderSkeleton();

    const { data, error } = await sb
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      renderError(error.message);
      return;
    }

    renderRows(data || []);
    subscribeToNewSessions();
  }

  function subscribeToNewSessions() {
    if (subscribed || !sb) return;
    subscribed = true;

    sb.channel("game_sessions_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: TABLE }, (payload) => {
        const list = document.getElementById("sessions-list");
        if (!list) return;

        const emptyEl = list.querySelector(".session-empty");
        if (emptyEl) emptyEl.remove();

        list.insertAdjacentHTML("afterbegin", sessionRowHTML(payload.new, true));

        // trim to PAGE_SIZE so the feed doesn't grow unbounded during a long session
        const rows = list.querySelectorAll(".session-row");
        if (rows.length > PAGE_SIZE) rows[rows.length - 1].remove();

        const dot = document.getElementById("sessions-status-dot");
        if (dot) {
          dot.classList.add("flash");
          setTimeout(() => dot.classList.remove("flash"), 900);
        }
      })
      .subscribe();
  }

  loadSessions();
})();
