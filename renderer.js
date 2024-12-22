document.addEventListener("DOMContentLoaded", () => {
  console.log("window.electronAPI:", window.electronAPI);

  const walletInfo = document.getElementById("wallet-info");
  const connectButton = document.getElementById("connect-wallet");
  const browserInfo = document.getElementById("browser-info");
  const browserLink = document.getElementById("browser-link");
  const walletBalance = document.getElementById("wallet-balance");

  // Handle wallet connection message from the main process
  window.electronAPI.onWalletConnected(async (walletAddress) => {
    browserInfo.style.display = "none";
    connectButton.style.display = "none";
    walletInfo.textContent = `Wallet Connected: ${walletAddress}`;

    try {
      walletBalance.style.display = "block";
      const balance = await window.ethersAPI.getWalletBalance(walletAddress);
      walletBalance.textContent = `Balance: ${balance} ETH`;
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      walletBalance.textContent = "Error fetching balance.";
    }
  });

  // Open the web app in the default browser to connect the wallet
  connectButton.addEventListener("click", () => {
    browserInfo.style.display = "block";

    window.electronAPI.externalConnect("http://localhost:3001");
  });
});
