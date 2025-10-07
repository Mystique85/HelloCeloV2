// CONFIG
const CONTRACT_ADDRESS = "0x12b6e1f30cb714e8129F6101a7825a910a9982F2";
const CONTRACT_ABI = [ /* Wklej tutaj pełne ABI Twojego kontraktu */ ];

let provider, signer, contract, currentAccount;

// UI references
const connectBtn = document.getElementById("connectWallet");
const walletStatus = document.getElementById("walletAddress");
const balanceSpan = document.getElementById("balance");
const remainingSpan = document.getElementById("remaining");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const messagesUl = document.getElementById("messages");

// --- SWITCH TO CELO MAINNET ---
async function switchToCelo() {
  if (!window.ethereum) return false;

  const CELO_CHAIN_ID = "0xa4ec"; // 42220 in hex
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CELO_CHAIN_ID }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CELO_CHAIN_ID,
            chainName: "Celo Mainnet",
            nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
            rpcUrls: ["https://forno.celo.org"],
            blockExplorerUrls: ["https://celo.blockscout.com"],
          }],
        });
        return true;
      } catch (addError) {
        console.error("Cannot add Celo Mainnet:", addError);
        return false;
      }
    } else {
      console.error("Switch network error:", switchError);
      return false;
    }
  }
}

// --- CONNECT WALLET ---
async function connectWallet() {
  if (!window.ethereum && !window.celo) {
    alert("No wallet detected! Install MetaMask, Valora or Rabby.");
    return false;
  }

  const injected = window.ethereum || window.celo;

  try {
    // Request accounts
    await (injected.request ? injected.request({ method: 'eth_requestAccounts' }) : injected.enable());

    // Switch to Celo
    await switchToCelo();

    provider = new ethers.providers.Web3Provider(injected);
    signer = provider.getSigner();
    currentAccount = await signer.getAddress();
    walletStatus.innerText = `Connected: ${currentAccount}`;

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    await updateBalance();
    await updateRemaining();
    await loadMessages();
    listenEvents();

    return true;
  } catch (err) {
    console.error("Wallet connect failed:", err);
    walletStatus.innerText = "Connection failed";
    return false;
  }
}

// --- UPDATE BALANCE AND REMAINING REWARDS ---
async function updateBalance() {
  if (!contract || !signer) return;
  const balance = await contract.balanceOf(currentAccount);
  balanceSpan.innerText = ethers.formatUnits(balance, 18);
}

async function updateRemaining() {
  if (!contract || !signer) return;
  const remaining = await contract.remainingRewards(currentAccount);
  remainingSpan.innerText = remaining.toString();
}

// --- LOAD MESSAGES ---
async function loadMessages() {
  if (!contract) return;
  try {
    const messages = await contract.getAllMessages();
    messagesUl.innerHTML = "";
    messages.forEach(m => {
      const li = document.createElement("li");
      const time = new Date(Number(m.timestamp) * 1000).toLocaleString();
      li.innerText = `[${time}] ${m.sender}: ${m.content}`;
      messagesUl.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading messages:", err);
  }
}

// --- SEND MESSAGE ---
async function sendMessage() {
  if (!contract || !currentAccount) {
    const connected = await connectWallet();
    if (!connected) return;
  }

  const text = messageInput.value.trim();
  if (!text) return alert("Message cannot be empty");

  try {
    const tx = await contract.sendMessage(text);
    await tx.wait();

    messageInput.value = "";
    await updateBalance();
    await updateRemaining();
    await loadMessages();
    alert("Message sent!");
  } catch (err) {
    console.error(err);
    alert("Error sending message. Check console.");
  }
}

// --- LISTEN TO EVENTS ---
function listenEvents() {
  if (!contract) return;
  contract.on("MessageSent", (sender, content, timestamp) => {
    const li = document.createElement("li");
    const time = new Date(Number(timestamp) * 1000).toLocaleString();
    li.innerText = `[${time}] ${sender}: ${content}`;
    messagesUl.appendChild(li);
    if (sender.toLowerCase() === currentAccount.toLowerCase()) {
      updateBalance();
      updateRemaining();
    }
  });
}

// --- EVENT LISTENERS ---
connectBtn.addEventListener("click", connectWallet);
sendMessageBtn.addEventListener("click", sendMessage);
