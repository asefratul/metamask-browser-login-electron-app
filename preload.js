const { contextBridge, ipcRenderer, shell } = require("electron");

// Expose IPC to the renderer process securely
contextBridge.exposeInMainWorld("electronAPI", {
  onWalletConnected: (callback) =>
    ipcRenderer.on("wallet-connected", (event, walletAddress) => {
      console.log(`event \n ${event}`);
      callback(walletAddress);
    }),
  externalConnect: (url) => ipcRenderer.send("external-connect", url)
});

// Expose ethers functionality securely
contextBridge.exposeInMainWorld("ethersAPI", {
  getWalletBalance: (address) =>
    ipcRenderer.invoke("wallet-balance:request", address)
});
console.log("Preload script loaded successfully");
