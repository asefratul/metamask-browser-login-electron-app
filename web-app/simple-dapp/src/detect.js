import detectEthereumProvider from "@metamask/detect-provider";

async function setup() {
  const provider = await detectEthereumProvider();

  if (provider && provider === window.ethereum) {
    console.log("MetaMask is available!");
    startApp(provider); // Initialize your dapp with MetaMask.
  } else {
    console.log("Please install MetaMask!");
    alert("Please install MetaMask!");
  }
}

function startApp(provider) {
  if (provider !== window.ethereum) {
    console.error("Do you have multiple wallets installed?");
  }
}

window.addEventListener("load", setup);

const chainId = await window.ethereum.request({ method: "eth_chainId" });

window.ethereum.on("chainChanged", handleChainChanged);

function handleChainChanged(chainId) {
  // We recommend reloading the page, unless you must do otherwise.
  window.location.reload();
}

// You should only attempt to request the user's account in response to user interaction, such as
// selecting a button. Otherwise, you risk spamming the user. If you fail to retrieve
// the user's account, you should encourage the user to initiate the attempt.
const ethereumButton = document.querySelector(".enableEthereumButton");
const showAccount = document.querySelector(".showAccount");
const signatureElement = document.getElementById("signature");

ethereumButton.addEventListener("click", () => {
  // getAccount();
  connectAndSignMessage();
});

// While awaiting the call to eth_requestAccounts, you should disable any buttons the user can
// select to initiate the request. MetaMask rejects any additional requests while the first is still
// pending.
async function getAccount() {
  const accounts = await window.ethereum
    .request({ method: "eth_requestAccounts" })
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error.
        // If this happens, the user rejected the connection request.
        console.log("Please connect to MetaMask.");
      } else {
        console.error(err);
      }
    });

  if (accounts) {
    console.log(accounts);
    const account = accounts[0];
    showAccount.innerHTML = account;

    // Redirect back to the desktop app with wallet info
    window.location.href = `x-dexfuel-myapp://wallet-connected?address=${account}`;
  }
}

// Function to connect wallet and sign a message
async function connectAndSignMessage() {
  try {
    // Step 1: Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      console.log("Wallet Address:", account);
      showAccount.innerHTML = account;

      // Step 2: Sign a message
      const message = "Authenticate with DEX Fuel Desktop App"; // Customize the message
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, account]
      });

      console.log("Signed Message:", signature);
      signatureElement.textContent = signature;

      // Step 3: Redirect back to the desktop app with wallet info
      const redirectUrl = `x-dexfuel-myapp://wallet-connected?address=${account}&signature=${signature}`;
      console.log("Redirect URL:", redirectUrl);

      // Redirect to Electron app
      window.location.href = redirectUrl;
    }
  } catch (error) {
    if (error.code === 4001) {
      console.log("User rejected the request.");
      alert("User rejected the request.");
    } else {
      alert("Error during connection or signing, check console logs.");
      console.error("Error during connection or signing:", error);
    }
  }
}
