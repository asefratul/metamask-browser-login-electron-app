const {
  app,
  BrowserWindow,
  // protocol,
  ipcMain,
  shell,
  dialog
} = require("electron/main");
const { Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const { ethers, formatEther } = require("ethers");

let mainWindow, tray;
const appIcon = nativeImage.createFromPath(
  path.join(__dirname, "assets", "icons/dex-fuel-icon.png")
);
const trayIcon = nativeImage.createFromPath(
  path.join(__dirname, "assets", "icons/dex-fuel-icon.png")
);

if (process.defaultApp) {
  console.log("default app");
  if (process.argv.length >= 2) {
    console.log("1: setting custom protocol");
    app.setAsDefaultProtocolClient("x-dexfuel-myapp", process.execPath, [
      path.resolve(process.argv[1])
    ]);
  }
} else {
  console.log("2: setting custom protocol");
  app.setAsDefaultProtocolClient("x-dexfuel-myapp");
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  console.log("got The Lock");
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    console.log(event);
    console.log(commandLine);
    console.log(workingDirectory);

    dialog.showErrorBox(
      "Welcome Back 2",
      `You arrived from: ${commandLine.pop().slice(0, -1)}`
    );
    parseLoggedInUrl(commandLine.pop().slice(0, -1));
  });

  app.dock.setIcon(appIcon);
  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    handleExternalConnect();
    handleWalletBalanceRequest();

    createMainWindow();
    setupTrayMenu();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("open-url", (event, url) => {
    console.log("event: open-url triggered");
    console.log(event);
    dialog.showErrorBox("Welcome Back 1", `You arrived from: ${url}`);
    parseLoggedInUrl(url);
  });
}

const parseLoggedInUrl = (url) => {
  try {
    // dialog.showErrorBox("Parsing Url", url);
    const parsedUrl = new URL(url);
    const address = parsedUrl.searchParams.get("address");

    // dialog.showErrorBox("Address Found", address);
    // dialog.showErrorBox("Parsed Url Href", parsedUrl.href);

    if (parsedUrl.href.includes("/wallet-connected") && address) {
      console.log("Custom Protocol: Wallet Address Received:", address);
      if (mainWindow) {
        // dialog.showErrorBox("Sending to renderer", address);
        mainWindow.webContents.send("wallet-connected", address);
      }
    }
  } catch (error) {
    dialog.showErrorBox("Parse Error", JSON.stringify(error));
    console.error("Error parsing URL in custom protocol handler:", error);
  }
};
// const registerCustomProtocol = () => {
//   console.log(`Main: registering custom protocol 'x-dexfuel-myapp'`);
//   protocol.handle("x-dexfuel-myapp", (request) => {
//     try {
//       const parsedUrl = new URL(request.url);
//       const address = parsedUrl.searchParams.get("address");

//       if (parsedUrl.pathname === "/wallet-connected" && address) {
//         console.log("Custom Protocol: Wallet Address Received:", address);
//         if (mainWindow) {
//           mainWindow.webContents.send("wallet-connected", address);
//         }
//       }
//     } catch (error) {
//       console.error("Error parsing URL in custom protocol handler:", error);
//     }

//     return { data: "" };
//   });
// };

const setupTrayMenu = () => {
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Item1", type: "radio", id: "item1" },
    { label: "Item2", type: "radio", id: "item2" },
    { label: "Item3", type: "radio", checked: true, id: "item3" },
    { label: "Item4", type: "radio", id: "item4" }
  ]);

  // tray.setToolTip("This is my application.");
  tray.setContextMenu(contextMenu);
  console.log(`setup tray menu done`);
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html").catch((error) => {
    console.error("Failed to load index.html:", error);
  });

  // Optional: Open DevTools during development
  // mainWindow.webContents.openDevTools();
};

const handleExternalConnect = () => {
  ipcMain.on("external-connect", (event, url) => {
    try {
      new URL(url); // Validate URL format
      shell.openExternal(url);
    } catch (error) {
      console.error("Invalid URL received for external connect:", url);
    }
  });
};
const handleWalletBalanceRequest = () => {
  ipcMain.handle("wallet-balance:request", async (event, address) => {
    console.log(event);
    const provider = new ethers.JsonRpcProvider(
      "https://mainnet.infura.io/v3/62945efd11e84771812db1f93e4d37a2"
    );
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  });
};

// app.whenReady().then(() => {
//   registerCustomProtocol();
//   handleExternalConnect();
//   createMainWindow();
// });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
