document.getElementById("open").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://studio.bestbargain.in/login" });
});
