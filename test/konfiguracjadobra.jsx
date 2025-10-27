import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { db } from './config/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, setDoc, getDoc, updateDoc, where 
} from 'firebase/firestore';

// ========== KONFIGURACJA ==========
const CONTRACT_ADDRESS = "0x12b6e1f30cb714e8129F6101a7825a910a9982F2";
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      }
    ],
    "name": "MessageSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "by",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "remainingToday",
        "type": "uint256"
      }
    ],
    "name": "RewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "by",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_DAILY_REWARDS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REWARD_PER_MESSAGE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "dailyCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMessages",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "content",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct HelloCelo.Message[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMessageCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "lastDayIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ownerBurn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "remainingRewards",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "rescueERC20",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_content",
        "type": "string"
      }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const CREATOR_ADDRESS = "0x443baEF78686Fc6b9e5e6DaEA24fe26a170c5ac8";

const AVAILABLE_AVATARS = ['🐶', '🐱', '🦊', '🐯', '🐻', '🐼', '🐨', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'];

// ========== GŁÓWNY KOMPONENT ==========
function App() {
  // Podstawowe stany
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Stan czatu
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Stan użytkowników
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐶');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('public');
  
  // Stan kontraktu
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [remaining, setRemaining] = useState('0');
  
  // Stan prywatnych wiadomości - DODANE NOWE STANY
  const [activeDMChat, setActiveDMChat] = useState(null);
  const [showDMModal, setShowDMModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessage, setPrivateMessage] = useState('');
  const [isStartingDM, setIsStartingDM] = useState(false);
  const [privateChats, setPrivateChats] = useState([]);
  const [activePrivateMessages, setActivePrivateMessages] = useState([]);
  const [privateMessageInput, setPrivateMessageInput] = useState('');
  const [isSendingPrivate, setIsSendingPrivate] = useState(false);

  const messagesEndRef = useRef(null);
  const privateMessagesEndRef = useRef(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    const savedAccount = localStorage.getItem('hub_portal_account');
    const savedUserData = localStorage.getItem('hub_portal_user_data');
    
    if (savedAccount) {
      setCurrentAccount(savedAccount);
      setWalletConnected(true);
      if (savedUserData) {
        setCurrentUser(JSON.parse(savedUserData));
      }
    }
  }, []);

  useEffect(() => {
    if (walletConnected && currentAccount && CONTRACT_ADDRESS) {
      initializeContract();
    }
  }, [walletConnected, currentAccount]);

  useEffect(() => {
    if (contract && currentAccount) {
      updateBalance();
      updateRemaining();
    }
  }, [contract, currentAccount]);

  useEffect(() => {
    if (!walletConnected || !db) return;

    // Subskrypcja wiadomości publicznych
    const messagesQuery = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    // Subskrypcja użytkowników
    const usersQuery = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersData);
      
      // Oblicz online users (ostatnio widziani < 5 minut)
      const online = usersData.filter(user => {
        if (!user.lastSeen) return false;
        const lastSeen = user.lastSeen.toDate();
        const now = new Date();
        return (now - lastSeen) < 5 * 60 * 1000;
      });
      setOnlineUsers(online);
    });

    // Subskrypcja prywatnych chatów - DODANE
    if (currentAccount) {
      const privateChatsQuery = query(
        collection(db, 'private_chats'),
        where('participants', 'array-contains', currentAccount.toLowerCase())
      );
      const unsubscribePrivateChats = onSnapshot(privateChatsQuery, (snapshot) => {
        const chatsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPrivateChats(chatsData);
      });

      return () => {
        unsubscribeMessages();
        unsubscribeUsers();
        unsubscribePrivateChats();
      };
    }

    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, [walletConnected, currentAccount]);

  // Subskrypcja wiadomości w aktywnym czacie prywatnym - DODANE
  useEffect(() => {
    if (!activeDMChat || !db) return;

    const privateMessagesQuery = query(
      collection(db, 'private_chats', activeDMChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribePrivateMessages = onSnapshot(privateMessagesQuery, (snapshot) => {
      const privateMessagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivePrivateMessages(privateMessagesData);
    });

    return () => unsubscribePrivateMessages();
  }, [activeDMChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    privateMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activePrivateMessages]);

  // ========== FUNKCJE KONTRAKTU ==========
  const initializeContract = async () => {
    try {
      // POPRAWIONE: Bezpieczne pobieranie providera
      let provider;
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
      } else if (window.celo) {
        provider = new ethers.providers.Web3Provider(window.celo);
      } else {
        throw new Error('No Ethereum provider found');
      }
      
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
      console.log('✅ Contract initialized');
    } catch (error) {
      console.error('❌ Contract initialization failed:', error);
    }
  };

  const updateBalance = async () => {
    if (!contract || !currentAccount) return;
    try {
      const balance = await contract.balanceOf(currentAccount);
      setBalance(ethers.utils.formatUnits(balance, 18));
    } catch (error) {
      console.error('Error updating balance:', error);
      setBalance('0');
    }
  };

  const updateRemaining = async () => {
    if (!contract || !currentAccount) return;
    try {
      const remaining = await contract.remainingRewards(currentAccount);
      setRemaining(remaining.toString());
    } catch (error) {
      console.error('Error updating remaining rewards:', error);
      setRemaining('0');
    }
  };

  // ========== FUNKCJE APLIKACJI ==========
  const connectWallet = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // POPRAWIONE: Bezpieczne wykrywanie providera
      let ethereumProvider;
      if (window.ethereum) {
        ethereumProvider = window.ethereum;
      } else if (window.celo) {
        ethereumProvider = window.celo;
      } else {
        alert('Please install MetaMask or Celo Extension Wallet!');
        return;
      }

      console.log('🔄 Requesting wallet connection...');
      
      let accounts;
      if (ethereumProvider.request) {
        accounts = await ethereumProvider.request({ 
          method: 'eth_requestAccounts' 
        });
      } else if (ethereumProvider.enable) {
        accounts = await ethereumProvider.enable();
      } else {
        alert('Wallet does not support connection requests');
        return;
      }
      
      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        console.log('✅ Wallet connected:', account);
        setCurrentAccount(account);
        setWalletConnected(true);
        localStorage.setItem('hub_portal_account', account);

        // Sprawdź czy użytkownik istnieje w bazie
        try {
          const userDoc = await getDoc(doc(db, 'users', account.toLowerCase()));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser(userData);
            localStorage.setItem('hub_portal_user_data', JSON.stringify(userData));
            updateUserLastSeen(account);
          } else {
            setShowNicknameModal(true);
          }
        } catch (firebaseError) {
          console.error('Firebase error:', firebaseError);
          setShowNicknameModal(true);
        }
      }
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else {
        alert('Failed to connect wallet: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserLastSeen = async (walletAddress) => {
    if (!walletAddress || !db) return;
    try {
      const userRef = doc(db, 'users', walletAddress.toLowerCase());
      await updateDoc(userRef, {
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  const registerUser = async () => {
    if (!currentAccount || nicknameInput.length < 3) {
      alert('Nickname must be at least 3 characters long');
      return;
    }

    try {
      const userData = {
        walletAddress: currentAccount.toLowerCase(),
        nickname: nicknameInput,
        avatar: selectedAvatar,
        avatarType: 'emoji',
        isRegistered: true,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        nicknameLocked: currentAccount.toLowerCase() !== CREATOR_ADDRESS.toLowerCase()
      };

      await setDoc(doc(db, 'users', currentAccount.toLowerCase()), userData);
      
      setCurrentUser(userData);
      localStorage.setItem('hub_portal_user_data', JSON.stringify(userData));
      setShowNicknameModal(false);
      setNicknameInput('');
      
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register user');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !db) return;
    if (isSending) return;

    setIsSending(true);
    
    try {
      // Wyślij do kontraktu blockchain dla nagród
      if (contract) {
        try {
          const tx = await contract.sendMessage(newMessage);
          console.log('📝 Message sent to contract, TX:', tx.hash);
          await tx.wait();
          console.log('✅ Transaction confirmed');
          
          // Zaktualizuj nagrody
          await updateBalance();
          await updateRemaining();
        } catch (contractError) {
          console.error('Contract error:', contractError);
        }
      }
      
      // Wyślij do Firebase dla chatu
      await addDoc(collection(db, 'messages'), {
        content: newMessage,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        avatarType: currentUser.avatarType,
        walletAddress: currentAccount.toLowerCase(),
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
      updateUserLastSeen(currentAccount);
      
    } catch (error) {
      console.error('Send message failed:', error);
      alert('Failed to send message: ' + (error.message || 'Check console for details'));
    } finally {
      setIsSending(false);
    }
  };

  // ========== POPRAWIONE FUNKCJE PRYWATNYCH WIADOMOŚCI ==========
  const startPrivateChat = async (user) => {
    // SPRAWDŹ czy chat już istnieje
    const chatId = [currentAccount.toLowerCase(), user.walletAddress.toLowerCase()].sort().join('_');
    
    try {
      const chatDoc = await getDoc(doc(db, 'private_chats', chatId));
      
      if (chatDoc.exists()) {
        // Chat istnieje → otwórz za darmo
        console.log('✅ Chat exists, opening for free');
        setActiveDMChat({
          id: chatId,
          user: user,
          participantNames: {
            [currentAccount.toLowerCase()]: currentUser.nickname,
            [user.walletAddress.toLowerCase()]: user.nickname
          },
          participantAvatars: {
            [currentAccount.toLowerCase()]: currentUser.avatar,
            [user.walletAddress.toLowerCase()]: user.avatar
          }
        });
      } else {
        // Chat nie istnieje → pokaż modal z opłatą
        console.log('🆕 New chat, showing payment modal');
        setSelectedUser(user);
        setShowDMModal(true);
      }
    } catch (error) {
      console.error('Error checking chat status:', error);
      // W przypadku błędu, domyślnie pokaż modal
      setSelectedUser(user);
      setShowDMModal(true);
    }
  };

  const confirmPrivateChat = async () => {
    if (!selectedUser || !privateMessage.trim() || !contract) return;
    
    setIsStartingDM(true);
    try {
      // 1. Wywołaj kontrakt - opłata 1 HC za rozpoczęcie chatu
      console.log('🔐 Starting private chat with:', selectedUser.nickname);
      
      const tx = await contract.sendMessage(`[PRIVATE] ${privateMessage}`);
      await tx.wait();
      
      // 2. Utwórz prywatny chat w Firebase
      const chatId = [currentAccount.toLowerCase(), selectedUser.walletAddress.toLowerCase()].sort().join('_');
      
      await setDoc(doc(db, 'private_chats', chatId), {
        participants: [currentAccount.toLowerCase(), selectedUser.walletAddress.toLowerCase()],
        participantNames: {
          [currentAccount.toLowerCase()]: currentUser.nickname,
          [selectedUser.walletAddress.toLowerCase()]: selectedUser.nickname
        },
        participantAvatars: {
          [currentAccount.toLowerCase()]: currentUser.avatar,
          [selectedUser.walletAddress.toLowerCase()]: selectedUser.avatar
        },
        createdAt: serverTimestamp(),
        lastMessage: serverTimestamp(),
        lastMessageContent: privateMessage,
        paidBy: currentAccount.toLowerCase() // ZAPISUJEMY kto opłacił inicjację
      });

      // 3. Wyślij pierwszą wiadomość
      await addDoc(collection(db, 'private_chats', chatId, 'messages'), {
        content: privateMessage,
        sender: currentAccount.toLowerCase(),
        senderNickname: currentUser.nickname,
        senderAvatar: currentUser.avatar,
        timestamp: serverTimestamp(),
        isFirstMessage: true
      });

      // 4. OTWÓRZ OKNO CZATU PRYWATNEGO
      setActiveDMChat({
        id: chatId,
        user: selectedUser,
        participantNames: {
          [currentAccount.toLowerCase()]: currentUser.nickname,
          [selectedUser.walletAddress.toLowerCase()]: selectedUser.nickname
        },
        participantAvatars: {
          [currentAccount.toLowerCase()]: currentUser.avatar,
          [selectedUser.walletAddress.toLowerCase()]: selectedUser.avatar
        }
      });

      // 5. Zamknij modal i wyczyść stan
      setShowDMModal(false);
      setPrivateMessage('');
      setSelectedUser(null);
      
      // 6. Zaktualizuj nagrody
      await updateBalance();
      await updateRemaining();
      
      console.log('✅ Private chat started successfully');
      
    } catch (error) {
      console.error('Failed to start private chat:', error);
      alert('Failed to start private chat: ' + error.message);
    } finally {
      setIsStartingDM(false);
    }
  };

  // WYSYŁANIE WIADOMOŚCI PRYWATNEJ - POPRAWIONE
  const sendPrivateMessage = async () => {
    if (!activeDMChat || !privateMessageInput.trim() || !db) return;
    if (isSendingPrivate) return;

    setIsSendingPrivate(true);
    
    try {
      // SPRAWDŹ czy to pierwsza wiadomość w tym kierunku
      const chatDoc = await getDoc(doc(db, 'private_chats', activeDMChat.id));
      const chatData = chatDoc.data();
      
      // Jeśli użytkownik nie opłacił jeszcze dostępu do tego chatu
      if (!chatData.paidBy || !chatData.paidBy.includes(currentAccount.toLowerCase())) {
        // Sprawdź czy to pierwsza wiadomość od tego użytkownika
        const myMessages = activePrivateMessages.filter(msg => 
          msg.sender === currentAccount.toLowerCase()
        );
        
        if (myMessages.length === 0) {
          // To pierwsza wiadomość - wymagaj opłaty
          console.log('💰 First message in this direction requires payment');
          setShowDMModal(true);
          setIsSendingPrivate(false);
          return;
        }
      }
      
      // WYŚLIJ WIADOMOŚĆ ZA DARMO (już opłacone)
      await addDoc(collection(db, 'private_chats', activeDMChat.id, 'messages'), {
        content: privateMessageInput,
        sender: currentAccount.toLowerCase(),
        senderNickname: currentUser.nickname,
        senderAvatar: currentUser.avatar,
        timestamp: serverTimestamp()
      });

      // Zaktualizuj ostatnią wiadomość w chacie
      await updateDoc(doc(db, 'private_chats', activeDMChat.id), {
        lastMessage: serverTimestamp(),
        lastMessageContent: privateMessageInput
      });

      setPrivateMessageInput('');
      
    } catch (error) {
      console.error('Send private message failed:', error);
      alert('Failed to send private message');
    } finally {
      setIsSendingPrivate(false);
    }
  };

  const closeDMChat = () => {
    setActiveDMChat(null);
    setActivePrivateMessages([]);
  };

  const handlePrivateKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrivateMessage();
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setCurrentAccount('');
    setCurrentUser(null);
    setMessages([]);
    setOnlineUsers([]);
    setAllUsers([]);
    setContract(null);
    setBalance('0');
    setRemaining('0');
    setActiveDMChat(null);
    setActivePrivateMessages([]);
    localStorage.removeItem('hub_portal_account');
    localStorage.removeItem('hub_portal_user_data');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ========== RENDER ==========
  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-12 max-w-md w-full">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-3xl">
            💎
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            HUB Portal
          </h1>
          <p className="text-gray-400 text-lg mb-8">Decentralized Social Chat on Celo</p>
          
          <button 
            onClick={connectWallet}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all transform hover:scale-105 mb-8"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              'Connect Wallet 🦊'
            )}
          </button>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-300 text-sm">
              💎 Earn HC Tokens
            </span>
            <span className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-300 text-sm">
              🔒 Private Messages
            </span>
            <span className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-300 text-sm">
              🌍 Celo Network
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse"></div>
      </div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-gray-700/50 flex-shrink-0">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                💎
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                HUB Chat
              </h3>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {onlineUsers.length} online
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
            {currentUser && (
              <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-xl border border-gray-600/50">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-xl">
                  {currentUser.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{currentUser.nickname}</div>
                  <div className="text-cyan-400 text-sm">HC: {balance}</div>
                  <div className="text-gray-400 text-xs">Rewards: {remaining}/10 left</div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
            <div className="flex bg-gray-700/50 rounded-xl p-1 border border-gray-600/50">
              <button 
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'public' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('public')}
              >
                💬 Public
              </button>
              <button 
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'users' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('users')}
              >
                👥 Users ({allUsers.length})
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-hidden flex flex-col p-4">
            <h4 className="text-gray-400 text-sm font-semibold mb-3 flex-shrink-0">
              {activeTab === 'public' ? `Online Users (${onlineUsers.length})` : `All Users (${allUsers.length})`}
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2">
              {(activeTab === 'public' ? onlineUsers : allUsers)
                .filter(user => user.walletAddress !== currentAccount.toLowerCase())
                .map(user => (
                  <div 
                    key={user.walletAddress}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-gray-600/50 hover:bg-gray-700/50 hover:border-cyan-500/30 flex-shrink-0"
                    onClick={() => startPrivateChat(user)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-base">
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{user.nickname}</div>
                      <div className="text-gray-400 text-xs truncate">
                        {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                  </div>
                ))}
            </div>
          </div>

          {/* Stats & Disconnect */}
          <div className="p-4 border-t border-gray-700/50 flex-shrink-0 space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl border border-gray-600/50">
              <span className="text-gray-400 text-sm">Daily Rewards:</span>
              <strong className="text-cyan-400">{remaining}/10</strong>
            </div>
            
            <button 
              onClick={disconnectWallet}
              className="w-full py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gray-900/50 min-w-0">
          <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 p-6 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                  💎
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  HUB Portal
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-cyan-400">
                  💎 HC: {balance}
                </span>
                <span className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl text-cyan-400">
                  🎯 Left: {remaining}/10
                </span>
                {contract ? (
                  <span className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
                    ✅ Contract
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400">
                    ⚠️ No Contract
                  </span>
                )}
              </div>
            </div>
          </header>

          <section className="flex-1 flex flex-col p-6 min-h-0">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map(msg => (
                <div key={msg.id} className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-4 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-sm">
                      {msg.avatar}
                    </div>
                    <strong className="text-white">{msg.nickname}</strong>
                    <span className="text-gray-400 text-sm ml-auto">
                      {msg.timestamp?.toDate ? 
                        msg.timestamp.toDate().toLocaleTimeString() : 
                        'Just now'}
                    </span>
                  </div>
                  <div className="text-white ml-11">{msg.content}</div>
                  
                  {/* Reactions */}
                  <div className="ml-11 mt-2 flex gap-2">
                    <button className="text-gray-400 hover:text-cyan-400 text-sm transition-all transform hover:scale-110">
                      ❤️
                    </button>
                    <button className="text-gray-400 hover:text-cyan-400 text-sm transition-all transform hover:scale-110">
                      😂
                    </button>
                    <button className="text-gray-400 hover:text-cyan-400 text-sm transition-all transform hover:scale-110">
                      🚀
                    </button>
                    <button className="text-gray-400 hover:text-cyan-400 text-sm transition-all transform hover:scale-110">
                      ⭐
                    </button>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex gap-3 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 flex-shrink-0">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message in public chat... (Enter to send)"
                disabled={isSending}
                className="flex-1 bg-transparent border-none text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-0 disabled:opacity-50"
              />
              <button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {isSending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </section>
        </div>

        {/* PRIVATE CHAT PANEL - DODANE */}
        {activeDMChat && (
          <div className="w-96 bg-gray-800/50 backdrop-blur-xl border-l border-gray-700/50 flex flex-col h-full">
            {/* DM Header */}
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-lg">
                  {activeDMChat.participantAvatars[Object.keys(activeDMChat.participantAvatars).find(key => key !== currentAccount.toLowerCase())]}
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {activeDMChat.participantNames[Object.keys(activeDMChat.participantNames).find(key => key !== currentAccount.toLowerCase())]}
                  </div>
                  <div className="text-green-400 text-sm">Online</div>
                </div>
              </div>
              <button 
                onClick={closeDMChat}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* DM Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activePrivateMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <div className="text-6xl mb-4">💬</div>
                  <p>Start a private conversation</p>
                  <p className="text-sm text-gray-500 mt-2">Your messages are end-to-end encrypted</p>
                </div>
              ) : (
                activePrivateMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`p-4 rounded-2xl max-w-[85%] ${
                      msg.sender === currentAccount.toLowerCase()
                        ? 'bg-cyan-500/20 ml-auto border border-cyan-500/30'
                        : 'bg-gray-700/50 border border-gray-600/50'
                    }`}
                  >
                    <div className="text-white">{msg.content}</div>
                    <div className="text-gray-400 text-xs mt-2 text-right">
                      {msg.timestamp?.toDate?.().toLocaleTimeString() || 'Now'}
                    </div>
                  </div>
                ))
              )}
              <div ref={privateMessagesEndRef} />
            </div>

            {/* DM Input */}
            <div className="p-4 border-t border-gray-700/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={privateMessageInput}
                  onChange={(e) => setPrivateMessageInput(e.target.value)}
                  placeholder={`Type a private message...`}
                  onKeyPress={handlePrivateKeyPress}
                  className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                />
                <button
                  onClick={sendPrivateMessage}
                  disabled={!privateMessageInput.trim() || isSendingPrivate}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  {isSendingPrivate ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nickname Registration Modal */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Warning Banner */}
            {!currentUser && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3 animate-pulse">
                <div className="text-yellow-400 text-xl">⚠️</div>
                <div>
                  <div className="font-semibold text-yellow-400 text-sm">Important: Your nickname cannot be changed later!</div>
                  <div className="text-yellow-300/80 text-xs mt-1">Choose wisely as this will be your permanent identity in HUB Portal.</div>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                {currentUser ? 'Edit Profile' : 'Welcome to HUB Portal!'} 🎉
              </h2>
              <p className="text-gray-400">{currentUser ? 'Update your profile' : 'Create your identity'}</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-4 text-center">Choose your avatar:</h4>
                
                <div className="grid grid-cols-8 gap-2 mb-4">
                  {AVAILABLE_AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                        selectedAvatar === avatar
                          ? 'bg-cyan-500 border-2 border-cyan-400 scale-110'
                          : 'bg-gray-700/50 border border-gray-600/50 hover:scale-105'
                      }`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
              
              <input 
                type="text" 
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter your nickname..."
                maxLength={20}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
              />
              
              <button 
                onClick={registerUser}
                disabled={nicknameInput.length < 3}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {currentUser ? 'Update Profile' : 'Join HUB Portal'} 🚀
              </button>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-gray-400">Earn 1 HC token for every message! 💎</p>
            </div>
          </div>
        </div>
      )}

      {/* Private Chat Modal */}
      {showDMModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                Start Private Chat 🔒
              </h2>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-2xl">
                  {selectedUser.avatar}
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold text-lg">{selectedUser.nickname}</div>
                  <div className="text-cyan-400 text-sm">Cost: 1 HC</div>
                  <div className="text-green-400 text-sm">Reward: 1 HC</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4">
                <p className="text-cyan-400 text-sm text-center">
                  💡 <strong>First message requires 1 HC fee</strong><br/>
                  This prevents spam and rewards quality conversations
                </p>
              </div>
              
              <textarea 
                value={privateMessage}
                onChange={(e) => setPrivateMessage(e.target.value)}
                placeholder="Type your first private message..."
                rows="3"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent resize-none"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDMModal(false);
                    setSelectedUser(null);
                    setPrivateMessage('');
                  }}
                  className="flex-1 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPrivateChat}
                  disabled={!privateMessage.trim() || isStartingDM}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isStartingDM ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </div>
                  ) : (
                    'Start Chat (1 HC)'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;