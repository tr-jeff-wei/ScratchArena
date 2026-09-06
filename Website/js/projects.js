/* ScratchArena — project (arena) leaderboard page logic.
 * Unlike rankings.js (which ranks players within one arena), this ranks the
 * arenas themselves against each other, one leaderboard per category. */

(function () {
  SA.mountNavbar("projects");
  SA.mountFooter();

  const tabsRoot = document.getElementById("projects-tabs");
  const boardRoot = document.getElementById("projects-board-root");

  let activeId = SA_PROJECT_CATEGORIES[0].id;

  function renderTabs() {
    tabsRoot.innerHTML = SA_PROJECT_CATEGORIES.map(
      (cat) =>
        `<button class="tab-btn clip-btn${cat.id === activeId ? " active" : ""}" data-category-id="${cat.id}">${SA.escapeHTML(cat.label)}</button>`
    ).join("");

    tabsRoot.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeId = btn.dataset.categoryId;
        renderTabs();
        renderBoard();
      });
    });
  }

  function renderBoard() {
    const category = SA_PROJECT_CATEGORIES.find((c) => c.id === activeId);
    if (!category) {
      boardRoot.innerHTML = "";
      return;
    }

    // fresh wrapper each render so the fade-swap entrance animation re-triggers
    const wrapper = document.createElement("div");
    wrapper.className = "rankings-board";
    wrapper.innerHTML = `
      <div class="rankings-board-title">
        <h2 class="section-title" style="font-size:1.25rem;">${SA.escapeHTML(category.label)}</h2>
      </div>
      <p class="section-desc">${SA.escapeHTML(category.description)}</p>
      <div class="leaderboard-mount"></div>
    `;

    boardRoot.innerHTML = "";
    boardRoot.appendChild(wrapper);

    SA.mountProjectLeaderboard(wrapper.querySelector(".leaderboard-mount"), category);
  }

  renderTabs();
  renderBoard();
})();
