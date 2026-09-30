const script = document.createElement("script");
script.src = chrome.runtime.getURL("checker.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "CHECK_CURRENT_PROJECT") return false;

  let timeoutId;
  const handleResult = (event) => {
    if (event.source !== window || event.data?.source !== "scratch-arena-quiz-checker") return;
    if (event.data.type !== "CHECK_RESULT") return;

    window.removeEventListener("message", handleResult);
    clearTimeout(timeoutId);
    sendResponse(event.data.result);
  };

  window.addEventListener("message", handleResult);
  timeoutId = setTimeout(() => {
    window.removeEventListener("message", handleResult);
    sendResponse({ error: "無法取得 Scratch 專案資料，請重新載入編輯器後再試。" });
  }, 8000);

  window.postMessage({
    source: "scratch-arena-quiz-checker",
    type: "RUN_CHECK"
  }, "*");

  return true;
});