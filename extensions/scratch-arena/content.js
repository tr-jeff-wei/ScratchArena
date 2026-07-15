const script = document.createElement("script");

// Small debug log to confirm content script execution and how inject.js is
// resolved. Useful during development to verify chrome.runtime is available.
try {
  console.debug('[Scratch Arena] content.js running (content script context)');
} catch (e) {
  // defensive: console may not be available in some environments
}

// Defensive resolution of the extension URL. In some environments (e.g. when the
// page is opened outside of the extension context) chrome.runtime.getURL may
// return chrome-extension://invalid/ which causes a network error when used as
// a script src. Check for a valid URL first and fall back to a safer approach.
let injectUrl = null;
try {
  if (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
    injectUrl = chrome.runtime.getURL("inject.js");
  }
} catch (err) {
  injectUrl = null;
}

// Log what we resolved so it's visible in the page DevTools console.
try {
  if (injectUrl) {
    console.debug('[Scratch Arena] chrome.runtime.getURL("inject.js") =>', injectUrl);
    if (injectUrl.includes('chrome-extension://invalid')) {
      console.warn('[Scratch Arena] chrome.runtime returned an invalid extension URL');
    }
  } else {
    console.debug('[Scratch Arena] chrome.runtime.getURL not available');
  }
} catch (e) {
  /* ignore logging errors */
}

if (injectUrl && !injectUrl.includes("chrome-extension://invalid")) {
  console.debug('[Scratch Arena] injecting script from extension URL');
  script.src = injectUrl;
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
} else {
  console.debug('[Scratch Arena] attempting fallback: fetch /inject.js and inline');
  // Fallback: try to fetch inject.js from the same origin and inline it. This
  // keeps the page functional when the extension runtime is not available
  // (e.g. during local development or when content.js is run outside an
  // installed extension). If that also fails, log a warning and continue.
  fetch('/inject.js')
    .then((res) => {
      if (!res.ok) throw new Error('fallback fetch failed');
      return res.text();
    })
    .then((code) => {
      console.debug('[Scratch Arena] fallback fetch succeeded; inlining inject.js');
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
      // inline script removed after execution above by onload in original flow
    })
    .catch((e) => {
      // Last resort: don't inject, but avoid throwing. This prevents the
      // chrome-extension://invalid/ net::ERR_FAILED message and keeps the
      // console cleaner for debugging.
      console.warn('Could not load inject.js via extension URL or fallback:', e);
    });
}



let latestScratchInfo = null;

window.addEventListener("message",(e)=>{

    if(e.data.type==="SCRATCH_INFO"){

        latestScratchInfo = e.data;

    }

});

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{

    if(msg.type==="GET_SCRATCH_INFO"){

        sendResponse(latestScratchInfo);

    }

    return true;

});