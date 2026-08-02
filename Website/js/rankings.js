/* ScratchArena — rankings page logic */

(function () {
  SA.mountNavbar("rankings");
  SA.mountFooter();

  const tabsRoot = document.getElementById("rankings-tabs");
  const boardRoot = document.getElementById("rankings-board-root");

  let activeId = SA_LEVELS[0].id;

  function renderTabs() {
    tabsRoot.innerHTML = SA_LEVELS.map(
      (level) =>
        `<button class="tab-btn clip-btn${level.id === activeId ? " active" : ""}" data-level-id="${level.id}">${SA.escapeHTML(level.name)}</button>`
    ).join("");

    tabsRoot.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeId = btn.dataset.levelId;
        renderTabs();
        renderBoard();
      });
    });
  }

  function renderBoard() {
    const level = saGetLevel(activeId);
    if (!level) {
      boardRoot.innerHTML = "";
      return;
    }

    // fresh wrapper each render so the fade-swap entrance animation re-triggers
    const wrapper = document.createElement("div");
    wrapper.className = "rankings-board";
    wrapper.innerHTML = `
      <div class="rankings-board-title">
        <h2 class="section-title" style="font-size:1.25rem;">${SA.escapeHTML(level.name)}</h2>
        ${SA.difficultyBadgeHTML(level.difficulty)}
      </div>
      <div class="leaderboard-mount"></div>
    `;

    boardRoot.innerHTML = "";
    boardRoot.appendChild(wrapper);

    SA.mountLeaderboard(wrapper.querySelector(".leaderboard-mount"), level.id, SA_LEADERBOARDS[level.id] || []);
  }

  renderTabs();
  renderBoard();
})();
