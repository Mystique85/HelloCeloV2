// CONFIG - using environment variables
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
	{
		inputs: [],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: 'owner', type: 'address' },
			{ indexed: true, internalType: 'address', name: 'spender', type: 'address' },
			{ indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
		],
		name: 'Approval',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: 'sender', type: 'address' },
			{ indexed: false, internalType: 'string', name: 'content', type: 'string' },
			{ indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
			{ indexed: false, internalType: 'uint256', name: 'reward', type: 'uint256' },
		],
		name: 'MessageSent',
		type: 'event',
	},
	{
		inputs: [],
		name: 'getAllMessages',
		outputs: [
			{
				components: [
					{ internalType: 'address', name: 'sender', type: 'address' },
					{ internalType: 'string', name: 'content', type: 'string' },
					{ internalType: 'uint256', name: 'timestamp', type: 'uint256' },
				],
				internalType: 'struct HelloCelo.Message[]',
				name: '',
				type: 'tuple[]',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'getMessageCount',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'string', name: '_content', type: 'string' }],
		name: 'sendMessage',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
		name: 'remainingRewards',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
];

// --- Global variables ---
let currentUser = null;
let unsubscribeMessages = null;
let provider, signer, contract, currentAccount;
let walletConnected = false;

// --- UI references ---
const connectBtn = document.getElementById('connectWallet');
const walletStatus = document.getElementById('walletAddress');
const balanceSpan = document.getElementById('balance');
const remainingSpan = document.getElementById('remaining');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messagesUl = document.getElementById('messages');

function updateConnectButton(connected) {
	if (connected) {
		connectBtn.innerHTML = `<img src="logohellocelo.png" alt="HelloCelo logo" />Disconnect Wallet`;
	} else {
		connectBtn.innerHTML = `<img src="logohellocelo.png" alt="HelloCelo logo" />Connect Wallet`;
	}
}

function disconnectWallet() {
	walletConnected = false;
	currentAccount = null;
	currentUser = null;
	walletStatus.innerText = '';
	balanceSpan.innerText = '0';
	remainingSpan.innerText = '0';
	updateConnectButton(false);

	// Wyczyść subskrypcje Firebase
	if (unsubscribeMessages) {
		unsubscribeMessages();
		unsubscribeMessages = null;
	}

	provider = null;
	signer = null;
	contract = null;
}

// --- Switch to Celo Mainnet ---
async function switchToCelo() {
	if (!provider) return false;

	const CELO_CHAIN_ID = '0xa4ec'; // 42220 hex
	try {
		await provider.provider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: CELO_CHAIN_ID }],
		});
		return true;
	} catch (err) {
		if (err.code === 4902) {
			try {
				await provider.provider.request({
					method: 'wallet_addEthereumChain',
					params: [
						{
							chainId: CELO_CHAIN_ID,
							chainName: 'Celo Mainnet',
							nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
							rpcUrls: ['https://forno.celo.org'],
							blockExplorerUrls: ['https://celo.blockscout.com'],
						},
					],
				});
				return true;
			} catch (addErr) {
				console.error(addErr);
				return false;
			}
		}
		console.error(err);
		return false;
	}
}

// --- Funkcja rejestracji nicku ---
async function registerNickname(nickname) {
	if (!currentAccount) return false;
	
	try {
		await userService.registerUser(currentAccount, nickname);
		currentUser = { 
			walletAddress: currentAccount, 
			nickname: nickname,
			isRegistered: true 
		};
		return true;
	} catch (error) {
		console.error('Registration failed:', error);
		alert('Failed to register nickname');
		return false;
	}
}

// --- Modal do rejestracji nicku ---
function showNicknameModal() {
	const modal = document.createElement('div');
	modal.className = 'modal-overlay';
	
	modal.innerHTML = `
		<div class="modal-content">
			<h3>Choose Your Nickname</h3>
			<input type="text" id="nicknameInput" class="modal-input" 
				   placeholder="Enter your nickname (3-32 chars)" maxlength="32" />
			<button id="saveNickname" class="modal-button">Save Nickname</button>
			<p class="modal-info">This will be your anonymous identity in the app</p>
		</div>
	`;
	
	document.body.appendChild(modal);
	
	document.getElementById('saveNickname').addEventListener('click', async () => {
		const nickname = document.getElementById('nicknameInput').value.trim();
		if (nickname.length < 3) {
			alert('Nickname must be at least 3 characters long');
			return;
		}
		
		const success = await registerNickname(nickname);
		if (success) {
			modal.remove();
			showMainApp();
		}
	});
}

// --- Główna aplikacja po rejestracji ---
async function showMainApp() {
	// Ukryj modal jeśli jest
	const modal = document.querySelector('.modal-overlay');
	if (modal) modal.remove();
	
	// Zaktualizuj UI
	walletConnected = true;
	updateConnectButton(true);
	
	// Załaduj dane blockchain (dla balansu i nagród)
	await updateBalance();
	await updateRemaining();
	
	// WYŁĄCZ ładowanie wiadomości z blockchain - używamy Firebase z nickami
	// loadMessages(); // <-- TO WYŁĄCZ!
	
	// Wyłącz nasłuchiwanie eventów z blockchain dla wiadomości
	// listenEvents(); // <-- TO TEŻ WYŁĄCZ!
	
	// Subskrybuj wiadomości z Firebase (z nickami)
	if (unsubscribeMessages) unsubscribeMessages();
	unsubscribeMessages = userService.subscribeToMessages(displayMessages);
	
	console.log("App ready! Using Firebase messages with nicknames");
}

// --- Wyświetlanie wiadomości z Firebase ---
function displayMessages(messages) {
	messagesUl.innerHTML = '';
	
	messages.forEach(msg => {
		const li = document.createElement('li');
		const time = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
		
		li.innerHTML = `
			<strong style="color: #00ffd0;">${msg.nickname}</strong>: ${msg.content}
			<br><small style="opacity: 0.7;">${time.toLocaleString()}</small>
		`;
		messagesUl.appendChild(li);
	});
}

// --- Connect Wallet (ZMODYFIKOWANA) ---
async function connectWallet() {
	let injected = window.celo || window.ethereum;
	if (!injected) {
		alert('No wallet detected! Install MetaMask, Rabby, or Celo Extension.');
		return false;
	}

	try {
		if (injected.request) await injected.request({ method: 'eth_requestAccounts' });
		else if (injected.enable) await injected.enable();

		provider = new ethers.providers.Web3Provider(injected);
		await switchToCelo();

		signer = provider.getSigner();
		currentAccount = await signer.getAddress();
		walletStatus.innerText = `Connected: ${currentAccount}`;

		contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

		// SPRAWDŹ CZY MA NICK W FIREBASE
		const userData = await userService.getUser(currentAccount);
		if (userData) {
			currentUser = userData;
			showMainApp();
		} else {
			showNicknameModal();
		}

		return true;
	} catch (err) {
		console.error('Wallet connect failed:', err);
		walletStatus.innerText = 'Connection failed';
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

// --- Load Messages (newest first) ---
async function loadMessages() {
	if (!contract) return;
	const messages = await contract.getAllMessages();
	messagesUl.innerHTML = '';

	// Odwróć tablicę, aby najnowsze były pierwsze
	const reversed = messages.slice().reverse();

	reversed.forEach(m => {
		const li = document.createElement('li');
		li.innerText = `[${new Date(Number(m.timestamp) * 1000).toLocaleString()}] ${m.sender}: ${m.content}`;
		messagesUl.appendChild(li);
	});
}

// --- Send Message (ZMODYFIKOWANA) ---
async function sendMessage() {
	if (!currentUser) {
		alert('Please register your nickname first');
		return;
	}
	
	const text = messageInput.value.trim();
	if (!text) return alert('Message cannot be empty');

	try {
		// 1. Wyślij do FIREBASE (dla użytkowników - z nickiem)
		await userService.sendMessage({
			content: text,
			nickname: currentUser.nickname,
			walletAddress: currentAccount,
			anonymous: true
		});

		// 2. Wyślij do BLOCKCHAIN (dla nagrody)
		const tx = await contract.sendMessage(text);
		await tx.wait();
		
		messageInput.value = '';
		await updateBalance();
		await updateRemaining();
		
	} catch (err) {
		console.error(err);
		alert('Failed to send message: ' + (err.message || 'Check console'));
	}
}

// --- Listen to events (add new on top) ---
function listenEvents() {
	if (!contract) return;
	contract.on('MessageSent', (sender, content, timestamp, reward) => {
		const li = document.createElement('li');
		li.innerText = `[${new Date(Number(timestamp) * 1000).toLocaleString()}] ${sender}: ${content} (+${reward})`;

		// Dodaj nową wiadomość na górę listy
		messagesUl.insertBefore(li, messagesUl.firstChild);

		// Aktualizuj saldo, jeśli to wiadomość od aktualnego użytkownika
		if (sender.toLowerCase() === currentAccount.toLowerCase()) {
			updateBalance();
			updateRemaining();
		}
	});
}

// --- Event listeners ---
connectBtn.addEventListener('click', async () => {
	if (!walletConnected) {
		const success = await connectWallet();
		if (success) {
			walletConnected = true;
			updateConnectButton(true);
		}
	} else {
		disconnectWallet();
	}
});
sendMessageBtn.addEventListener('click', sendMessage);