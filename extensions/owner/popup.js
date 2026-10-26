document.getElementById("open").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://bestbargain.in/login" });
});
