function safeText(selector) {
  return document.querySelector(selector)?.innerText?.trim() || "";
}

function scrapeLinkedIn() {
  return {
    title: safeText(".job-details-jobs-unified-top-card__job-title"),
    company: safeText(".job-details-jobs-unified-top-card__company-name"),
    description: safeText("#job-details"),
  };
}

function scrapeIndeed() {
  return {
    title: safeText('[data-testid="jobsearch-JobInfoHeader-title"]'),
    company: safeText('[data-testid="inlineHeader-companyName"]'),
    description: safeText("#jobDescriptionText"),
  };
}

function getJobDataForCurrentHost() {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes("linkedin.com")) {
    return scrapeLinkedIn();
  }

  if (hostname.includes("indeed.com")) {
    return scrapeIndeed();
  }

  return {
    title: "",
    company: "",
    description: "",
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "getJobData") {
    const data = getJobDataForCurrentHost();
    sendResponse({
      title: data.title || "",
      company: data.company || "",
      description: data.description || "",
    });
  }
});
