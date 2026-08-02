/* ============================================================================
 * REAL INTEGRATION HOOK
 * ============================================================================
 * In production, the ScratchArena browser extension will grade a player's
 * Scratch project against the level's validation rules (block diffing,
 * output checks, etc.) and deliver a result here — most likely via
 * `window.postMessage` from an injected content script, or a
 * `chrome.runtime.onMessageExternal` listener registered by this page, e.g.
 *
 *   window.addEventListener("message", (e) => {
 *     if (e.data?.source === "scratcharena-extension") {
 *       applyScoreToLeaderboard(currentEntries, e.data.payload);
 *     }
 *   });
 *
 * Until that's wired up, `saMockReceiveExtensionScore` simulates the payload
 * the extension would send, and `saApplyScoreToLeaderboard` simulates the
 * client-side reducer that turns it into a leaderboard update.
 * ============================================================================ */

/** Simulates the extension's async grading round-trip (network + validation delay). */
function saMockReceiveExtensionScore(payload, delayMs) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delayMs === undefined ? 900 : delayMs);
  });
}

/**
 * Pure function that folds an incoming extension payload into the current
 * leaderboard state: upserts the player's entry, re-sorts by score, and
 * recomputes ranks.
 */
function saApplyScoreToLeaderboard(current, payload) {
  const existingIndex = current.findIndex(
    (entry) => entry.playerName.toLowerCase() === payload.playerName.toLowerCase()
  );

  const updatedEntry = {
    id: existingIndex >= 0 ? current[existingIndex].id : `${payload.levelId}-${payload.playerName}-${Date.now()}`,
    rank: 0,
    playerName: payload.playerName,
    score: payload.score,
    passedValidation: payload.passedValidation,
    isCurrentUser: existingIndex >= 0 ? current[existingIndex].isCurrentUser : false,
    updatedAt: new Date().toISOString(),
    justUpdated: true,
  };

  const next = current.map((e) => ({ ...e, justUpdated: false }));
  if (existingIndex >= 0) {
    if (updatedEntry.score >= next[existingIndex].score) {
      next[existingIndex] = updatedEntry;
    }
  } else {
    next.push(updatedEntry);
  }

  return next
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
