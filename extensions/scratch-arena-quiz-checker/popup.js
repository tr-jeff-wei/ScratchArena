const startButton = document.getElementById("start-check");
const summary = document.getElementById("summary");
const results = document.getElementById("results");

startButton.addEventListener("click", runCheck);

function runCheck() {
  startButton.disabled = true;
  setSummary("正在檢查目前專案…", "idle", "…");
  results.replaceChildren();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id || !tab.url?.startsWith("https://scratch.mit.edu/projects/")) {
      showError("請先開啟 Scratch 專案編輯器。");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "CHECK_CURRENT_PROJECT" }, (response) => {
      if (chrome.runtime.lastError) {
        showError("無法連線至 Scratch 編輯器，請重新載入專案頁面後再試。");
        return;
      }
      if (!response || response.error) {
        showError(response?.error || "檢核未能完成。");
        return;
      }

      const allChecks = response.groups.flatMap((group) => group.checks);
      const passedCount = allChecks.filter((check) => check.passed).length;
      const state = response.passed ? "pass" : "fail";
      setSummary(
        `${response.passed ? "檢核通過" : "尚未通過"} · ${passedCount}/${allChecks.length} 項`,
        state,
        response.passed ? "✓" : "!"
      );

      response.groups.forEach((group) => {
        const section = document.createElement("section");
        section.className = "group";
        section.dataset.kind = group.type;

        const heading = document.createElement("div");
        heading.className = "group-heading";
        const kind = document.createElement("span");
        kind.className = "group-kind";
        kind.textContent = group.type === "stage" ? "ST" : "SP";
        const name = document.createElement("span");
        name.className = "group-name";
        name.textContent = group.name;
        const groupPassed = group.checks.filter((check) => check.passed).length;
        const count = document.createElement("span");
        count.className = "group-count";
        count.dataset.state = groupPassed === group.checks.length ? "pass" : "fail";
        count.textContent = `${groupPassed}/${group.checks.length}`;
        heading.append(kind, name, count);
        section.append(heading);

        group.checks.forEach((check) => {
          const item = document.createElement("div");
          item.className = `result ${check.passed ? "pass" : "fail"}`;

          const icon = document.createElement("span");
          icon.className = "icon";
          icon.setAttribute("aria-label", check.passed ? "通過" : "未通過");
          icon.textContent = check.passed ? "✓" : "×";

          const content = document.createElement("div");
          const label = document.createElement("div");
          label.className = "label";
          label.textContent = check.label;
          const detail = document.createElement("div");
          detail.className = "detail";
          detail.textContent = check.detail;
          content.append(label, detail);
          item.append(icon, content);
          section.append(item);
        });
        results.append(section);
      });
      startButton.disabled = false;
    });
  });
}

function showError(message) {
  setSummary("檢核無法完成", "fail", "!");
  const item = document.createElement("div");
  item.className = "empty";
  item.textContent = message;
  results.replaceChildren(item);
  startButton.disabled = false;
}

function setSummary(message, state, mark) {
  summary.dataset.state = state;
  const icon = document.createElement("span");
  icon.className = "summary-mark";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = mark;
  const text = document.createElement("span");
  text.textContent = message;
  summary.replaceChildren(icon, text);
}