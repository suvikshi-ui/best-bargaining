document.getElementById("open").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://rainside-shop.vercel.app/login" });
});
