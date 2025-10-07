// CONFIG
const CONTRACT_ADDRESS = "0x12b6e1f30cb714e8129F6101a7825a910a9982F2";
const CONTRACT_ABI = [
  {
    "inputs": [], "stateMutability": "nonpayable", "type": "constructor"
  },
  {
    "anonymous": false, "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "spender", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ], "name": "Approval", "type": "event"
  },
  {
    "anonymous": false, "inputs": [
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "content", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256" }
    ], "name": "MessageSent", "type": "event"
  },
  {
    "inputs": [], "name": "getAllMessages", "outputs": [
      { "components": [
        { "internalType": "address", "name": "sender", "type": "address" },
        { "internalType": "string", "name": "content", "type": "string" },
        { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ], "internalType": "struct HelloCelo.Message[]", "name": "", "type": "tuple[]" }
    ], "stateMutability": "view", "type": "function"
  },
  { "inputs": [], "name": "getMessageCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "_content", "type": "string" }], "name": "sendMessage", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "remainingRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// --- Global variables ---
let provider, signer, contract, currentAccount;

// --- UI references ---
const connectBtn = document.getElementById("connectWallet");
const walletStatus = document.getElementById("walletAddress");
const balanceSpan = document.getElementById("balance");
const remainingSpan = document.getElementById("remaining");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const messagesUl = document.getElementById("messages");

// --- Switch to Celo Mainnet ---
async function switchToCelo() {
  if (!provider) return false;

  const CELO_CHAIN_ID = "0xa4ec"; // 42220 hex
  try {
    await provider.provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CELO_CHAIN_ID }]
    });
    return true;
  } catch (err) {
    if (err.code === 4902) {
      try {
        await provider.provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CELO_CHAIN_ID,
            chainName: "Celo Mainnet",
            nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
            rpcUrls: ["https://forno.celo.org"],
            blockExplorerUrls: ["https://celo.blockscout.com"]
          }]
        });
        return true;
      } catch (addErr) { console.error(addErr); return false; }
    }
    console.error(err);
    return false;
  }
}

// --- Connect Wallet ---
async function connectWallet() {
  let injected = window.celo || window.ethereum;
  if (!injected) {
    alert("No wallet detected! Install MetaMask, Rabby, or Celo Extension.");
    return false;
  }

  try {
    // Poproś o połączenie kont
    if (injected.request) await injected.request({ method: 'eth_requestAccounts' });
    else if (injected.enable) await injected.enable();

    provider = new ethers.providers.Web3Provider(injected);

    // Najpierw przełącz sieć
    await switchToCelo();

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

// --- Update Balance ---
async function updateBalance() {
  if (!contract || !currentAccount) return;
  const balance = await contract.balanceOf(currentAccount);
  balanceSpan.innerText = ethers.utils.formatUnits(balance, 18);
}

// --- Update Remaining Rewards ---
async function updateRemaining() {
  if (!contract || !currentAccount) return;
  const remaining = await contract.remainingRewards(currentAccount);
  remainingSpan.innerText = remaining.toString();
}

// --- Load Messages ---
async function loadMessages() {
  if (!contract) return;
  const messages = await contract.getAllMessages();
  messagesUl.innerHTML = "";
  messages.forEach(m => {
    const li = document.createElement("li");
    li.innerText = `[${new Date(Number(m.timestamp)*1000).toLocaleString()}] ${m.sender}: ${m.content}`;
    messagesUl.appendChild(li);
  });
}

// --- Send Message ---
async function sendMessage() {
  if (!contract || !currentAccount) {
    if (!await connectWallet()) return;
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
    alert("Error sending message");
  }
}

// --- Listen to events ---
function listenEvents() {
  if (!contract) return;
  contract.on("MessageSent", (sender, content, timestamp, reward) => {
    const li = document.createElement("li");
    li.innerText = `[${new Date(Number(timestamp)*1000).toLocaleString()}] ${sender}: ${content} (+${reward})`;
    messagesUl.appendChild(li);

    if (sender.toLowerCase() === currentAccount.toLowerCase()) {
      updateBalance();
      updateRemaining();
    }
  });
}

// --- Event listeners ---
connectBtn.addEventListener("click", connectWallet);
sendMessageBtn.addEventListener("click", sendMessage);
