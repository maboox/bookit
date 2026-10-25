/* No network activity or page access in the background. */
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-library")
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup/popup.html?tab=1"),
    });
});
