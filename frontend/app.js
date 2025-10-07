const CONTRACT_ADDRESS = "0x12b6e1f30cb714e8129F6101a7825a910a9982F2";
const CONTRACT_ABI = [ /* wklej cały ABI tutaj */ ];

let provider, signer, contract;

const connectWalletBtn = document.getElementById("connectWallet");
const walletAddressP = document.getElementById("walletAddress");
const balanceSpan = document.getElementById("balance");
const remainingSpan = document.getElementById("remaining");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const messagesUl = document.getElementById("messages");

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    const address = await signer.getAddress();
    walletAddressP.innerText = `Connected: ${address}`;

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await updateBalance();
    await updateRemaining();
    await loadMessages();
    listenEvents();
  } else {
    alert("No Ethereum wallet detected. Install MetaMask or Valora.");
  }
}

async function updateBalance() {
  const address = await signer.getAddress();
  const balance = await contract.balanceOf(address);
  balanceSpan.innerText = ethers.formatUnits(balance, 18);
}

async function updateRemaining() {
  const address = await signer.getAddress();
  const remaining = await contract.remainingRewards(address);
  remainingSpan.innerText = remaining.toString();
}

async function loadMessages() {
  const messages = await contract.getAllMessages();
  messagesUl.innerHTML = "";
  messages.forEach(m => {
    const li = document.createElement("li");
    const time = new Date(Number(m.timestamp) * 1000).toLocaleString();
    li.innerText = `[${time}] ${m.sender}: ${m.content}`;
    messagesUl.appendChild(li);
  });
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return alert("Message cannot be empty");

  const tx = await contract.sendMessage(text);
  await tx.wait();
  messageInput.value = "";
  await updateBalance();
  await updateRemaining();
  await loadMessages();
}

function listenEvents() {
  contract.on("MessageSent", (sender, content, timestamp) => {
    const li = document.createElement("li");
    const time = new Date(Number(timestamp) * 1000).toLocaleString();
    li.innerText = `[${time}] ${sender}: ${content}`;
    messagesUl.appendChild(li);
  });
}

connectWalletBtn.onclick = connectWallet;
sendMessageBtn.onclick = sendMessage;
