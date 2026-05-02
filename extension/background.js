async function fetchWithLoopbackFallback(path, options) {
  const urls = [`http://127.0.0.1:8000${path}`, `http://localhost:8000${path}`];
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Network request failed.");
}

console.log("HireSphere Clipper background loaded v1.0.1");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "login") {
    const formData = new URLSearchParams();
    formData.append("username", message.username);
    formData.append("password", message.password);

    fetchWithLoopbackFallback("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    })
      .then(({ ok, data }) => {
        if (!ok) {
          sendResponse({ success: false, error: data?.detail || "Login failed." });
          return;
        }
        sendResponse({ success: true, data });
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }

  if (message.action === "saveJob") {
    fetchWithLoopbackFallback("/jobs/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${message.token}`,
      },
      body: JSON.stringify(message.payload),
    })
      .then(({ ok, data }) => {
        if (!ok) {
          sendResponse({ success: false, error: data?.detail || "Failed to save job." });
          return;
        }
        sendResponse({ success: true, data });
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));

    return true;
  }

  if (message.action === "getJobDataAndSave") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      const tabId = tabs?.[0]?.id;
      if (!tabId) {
        sendResponse({ success: false, error: "No active tab found." });
        return;
      }

      chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }, () => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }

        chrome.tabs.sendMessage(tabId, { action: "getJobData" }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          sendResponse({ success: true, data: response });
        });
      });
    });
    return true;
  }
});
