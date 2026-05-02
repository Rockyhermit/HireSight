document.addEventListener("DOMContentLoaded", () => {
  console.log("HireSphere Clipper popup loaded v1.0.1");

  const loginView = document.getElementById("login-view");
  const loggedInView = document.getElementById("logged-in-view");
  const statusMessage = document.getElementById("status-message");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const saveJobBtn = document.getElementById("save-job-btn");

  const logoutBtn = ensureLogoutButton(loggedInView);

  function setStatus(message, type = "") {
    statusMessage.textContent = message || "";
    statusMessage.classList.remove("status-success", "status-error");
    if (type === "success") statusMessage.classList.add("status-success");
    if (type === "error") statusMessage.classList.add("status-error");
  }

  function showLoginUI() {
    loginView.classList.remove("hidden");
    loggedInView.classList.add("hidden");
    emailInput.focus();
  }

  function showSaveUI() {
    loginView.classList.add("hidden");
    loggedInView.classList.remove("hidden");
  }

  function getStoredToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["token"], (result) => {
        resolve(result.token || "");
      });
    });
  }

  function setStoredToken(token) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ token }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }

  function clearStoredToken() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove("token", () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }

  function handleLogin() {
    const username = emailInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setStatus("Please enter email and password.", "error");
      return;
    }

    loginBtn.disabled = true;
    setStatus("Signing in...");
    console.log("Sending login message to background worker");

    chrome.runtime.sendMessage({ action: "login", username, password }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Login message error:", chrome.runtime.lastError);
        setStatus(
          `${chrome.runtime.lastError.message || "Login failed."} Reload the extension in chrome://extensions.`,
          "error"
        );
        loginBtn.disabled = false;
        return;
      }

      if (response?.success && response.data?.access_token) {
        setStoredToken(response.data.access_token).then(() => {
          showSaveUI();
          setStatus("Logged in successfully.", "success");
          passwordInput.value = "";
          loginBtn.disabled = false;
        });
      } else {
        setStatus(response?.error || "Login failed.", "error");
        loginBtn.disabled = false;
      }
    });
    return;
  }

  async function handleSaveJob() {
    saveJobBtn.disabled = true;
    setStatus("Collecting job details...");

    try {
      const token = await getStoredToken();
      if (!token) {
        showLoginUI();
        throw new Error("Session expired. Please log in again.");
      }

      const scrapedData = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getJobDataAndSave" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response?.success) {
            reject(new Error(response?.error || "Failed to read job data."));
            return;
          }
          resolve({
            title: response?.data?.title || "",
            company: response?.data?.company || "",
            description: response?.data?.description || "",
          });
        });
      });

      if (!scrapedData.title && !scrapedData.company && !scrapedData.description) {
        throw new Error("Could not detect job details on this page.");
      }

      const payload = {
        company_name: scrapedData.company || "",
        job_title: scrapedData.title || "",
        job_description: scrapedData.description || "",
        status: "Applied",
      };

      chrome.runtime.sendMessage({ action: "saveJob", token, payload }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Save message error:", chrome.runtime.lastError);
          setStatus(
            `${chrome.runtime.lastError.message || "Failed to save job."} Reload the extension in chrome://extensions.`,
            "error"
          );
          saveJobBtn.disabled = false;
          return;
        }

        if (response?.success) {
          setStatus("Job saved to HireSphere!", "success");
        } else {
          setStatus(response?.error || "Failed to save job.", "error");
        }
        saveJobBtn.disabled = false;
      });
      return;
    } catch (error) {
      console.error("Save job error:", error);
      setStatus(error.message || "Failed to save job.", "error");
      saveJobBtn.disabled = false;
    }
  }

  async function handleLogout() {
    try {
      await clearStoredToken();
      showLoginUI();
      setStatus("Logged out.", "success");
    } catch (error) {
      console.error("Logout error:", error);
      setStatus("Failed to log out.", "error");
    }
  }

  loginBtn.addEventListener("click", handleLogin);
  saveJobBtn.addEventListener("click", handleSaveJob);
  logoutBtn.addEventListener("click", handleLogout);

  getStoredToken().then((token) => {
    if (token) {
      showSaveUI();
    } else {
      showLoginUI();
    }
  });
});

function ensureLogoutButton(loggedInView) {
  let logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) return logoutBtn;

  logoutBtn = document.createElement("button");
  logoutBtn.id = "logout-btn";
  logoutBtn.type = "button";
  logoutBtn.className = "btn";
  logoutBtn.style.marginTop = "8px";
  logoutBtn.style.background = "#e2e8f0";
  logoutBtn.style.color = "#1e293b";
  logoutBtn.style.border = "1px solid #cbd5e1";
  logoutBtn.textContent = "Logout";
  loggedInView.appendChild(logoutBtn);
  return logoutBtn;
}
