import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ethers } from 'ethers';
import './App.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

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

// Zwierzęta zamiast emoji
const AVAILABLE_AVATARS = [
  '🐶', '🐱', '🦊', '🐯', '🐻', '🐼', '🐨', '🐮',
  '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅',
  '🦉', '🦇', '🐴', '🐝', '🪲', '🐢', '🐍', '🦎',
  '🐬', '🦭', '🐋', '🦈', '🐅', '🐘', '🦒', '🦘'
];

// Twórca aplikacji (ZMIEŃ NA SWÓJ ADRES)
const CREATOR_ADDRESS = "0xTwojAdresTutaj";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [remaining, setRemaining] = useState('0');
  const [messageInput, setMessageInput] = useState('');
  const [privateMessageInput, setPrivateMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐶');
  const [customAvatar, setCustomAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeDMChat, setActiveDMChat] = useState(null);
  const [dmChats, setDmChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNicknameWarning, setShowNicknameWarning] = useState(false);
  const [showDMSignature, setShowDMSignature] = useState(false);
  const [pendingDMUser, setPendingDMUser] = useState(null);
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const [highlightedUser, setHighlightedUser] = useState(null);

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [db, setDb] = useState(null);
  const [storage, setStorage] = useState(null);
  const unsubscribeRef = useRef(null);
  const unsubscribeDMRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const firestoreDb = getFirestore(app);
    const firebaseStorage = getStorage(app);
    setDb(firestoreDb);
    setStorage(firebaseStorage);
  }, []);

  useEffect(() => {
    if (contract && currentAccount) {
      updateBalance();
      updateRemaining();
    }
  }, [contract, currentAccount]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, privateMessages]);

  const userService = {
    async registerUser(walletAddress, nickname, avatar, avatarType = 'emoji', customAvatarUrl = null) {
      const userRef = doc(db, 'users', walletAddress.toLowerCase());
      await setDoc(userRef, {
        nickname,
        avatar,
        avatarType,
        customAvatarUrl,
        walletAddress: walletAddress.toLowerCase(),
        createdAt: serverTimestamp(),
        isRegistered: true,
        lastSeen: serverTimestamp(),
        nicknameLocked: true
      });
      return true;
    },

    async getUser(walletAddress) {
      const userRef = doc(db, 'users', walletAddress.toLowerCase());
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : null;
    },

    async searchUsers(query) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('nickname', '>=', query), where('nickname', '<=', query + '\uf8ff'));
      
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          resolve(usersData);
          unsubscribe();
        });
      });
    },

    async sendMessage(messageData) {
      const messagesRef = collection(db, 'messages');
      return await addDoc(messagesRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });
    },

    async sendPrivateMessage(chatId, messageData) {
      const messageRef = collection(db, 'private_messages', chatId, 'messages');
      return await addDoc(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });
    },

    async getOrCreateDMChat(user1, user2) {
      const participants = [user1.toLowerCase(), user2.toLowerCase()].sort();
      const chatId = participants.join('_');
      
      const chatRef = doc(db, 'private_messages', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants,
          createdAt: serverTimestamp(),
          lastMessage: serverTimestamp()
        });
      }
      
      return chatId;
    },

    subscribeToMessages(callback) {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      
      return onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messagesData);
      });
    },

    subscribeToPrivateMessages(chatId, callback) {
      const messagesRef = collection(db, 'private_messages', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      return onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(messagesData);
      });
    },

    subscribeToUsers(callback) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastSeen', 'desc'));
      
      return onSnapshot(q, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(usersData);
      });
    },

    subscribeToUserChats(walletAddress, callback) {
      const chatsRef = collection(db, 'private_messages');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', walletAddress.toLowerCase())
      );
      
      return onSnapshot(q, (snapshot) => {
        const chatsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(chatsData);
      });
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('File size must be less than 0.5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Użyj Base64 bezpośrednio - to ominie problem CORS
        const base64Image = e.target.result;
        setAvatarPreview(base64Image);
        setCustomAvatar(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const switchToCelo = async (provider) => {
    if (!provider) return false;

    const CELO_CHAIN_ID = '0xa4ec';
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
  };

  const requestSignature = async (message, currentProvider = null) => {
    const providerToUse = currentProvider || provider;
    if (!providerToUse) {
      console.error('No provider available for signature');
      return null;
    }
    try {
      console.log('Requesting signature for message:', message);
      const signer = providerToUse.getSigner();
      const signature = await signer.signMessage(message);
      console.log('Signature received:', signature);
      return signature;
    } catch (err) {
      console.error('Signature error:', err);
      return null;
    }
  };

  const registerNickname = async () => {
    if (!currentAccount || nicknameInput.length < 3) {
      alert('Nickname must be at least 3 characters long');
      return;
    }

    const signature = await requestSignature(
      `Register to HUB Portal with nickname: ${nicknameInput}`
    );

    if (!signature) {
      alert('Registration cancelled - signature required');
      return;
    }

    try {
      let customAvatarUrl = null;
      let finalAvatar = selectedAvatar;
      let avatarType = 'emoji';

      if (customAvatar && avatarPreview) {
        // UŻYJ BASE64 ZAMIAST UPLOADU DO FIREBASE
        customAvatarUrl = avatarPreview;
        finalAvatar = avatarPreview;
        avatarType = 'custom';
      }

      await userService.registerUser(currentAccount, nicknameInput, finalAvatar, avatarType, customAvatarUrl);
      setCurrentUser({ 
        walletAddress: currentAccount, 
        nickname: nicknameInput,
        avatar: finalAvatar,
        avatarType,
        customAvatarUrl,
        isRegistered: true,
        nicknameLocked: true
      });
      setShowNicknameModal(false);
      showMainApp();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Failed to register nickname');
    }
  };

  const showMainApp = async () => {
    setWalletConnected(true);
    
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = userService.subscribeToMessages((newMessages) => {
      setMessages(newMessages);
      
      // Sprawdź czy są nowe wiadomości od innych użytkowników
      const latestMessage = newMessages[0];
      if (latestMessage && latestMessage.walletAddress !== currentAccount) {
        setNewMessageNotification({
          user: latestMessage.nickname,
          message: latestMessage.content
        });
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 5000);
      }
    });
    
    userService.subscribeToUsers((users) => {
      setOnlineUsers(users.filter(user => 
        user.lastSeen && 
        new Date() - user.lastSeen.toDate() < 300000
      ));
    });

    userService.subscribeToUserChats(currentAccount, (chats) => {
      setDmChats(chats);
    });
  };

  const connectWallet = async () => {
    let injected = window.celo || window.ethereum;
    if (!injected) {
      alert('No wallet detected! Install MetaMask, Rabby, or Celo Extension.');
      return false;
    }

    try {
      if (injected.request) await injected.request({ method: 'eth_requestAccounts' });
      else if (injected.enable) await injected.enable();

      const web3Provider = new ethers.providers.Web3Provider(injected);
      await switchToCelo(web3Provider);

      const walletSigner = web3Provider.getSigner();
      const account = await walletSigner.getAddress();
      
      setProvider(web3Provider);
      setSigner(walletSigner);
      setCurrentAccount(account);

      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, walletSigner);
      setContract(contractInstance);

      // Podpis przy connect - używamy bieżącego providera
      const signature = await requestSignature(
        "Connect to HUB Portal - this signature verifies your wallet ownership",
        web3Provider
      );

      if (!signature) {
        alert('Connection cancelled - signature required');
        return false;
      }

      const userData = await userService.getUser(account);
      
      setShowNicknameModal(true);
      
      if (userData) {
        setNicknameInput(userData.nickname || '');
        setSelectedAvatar(userData.avatar || '🐶');
        if (userData.avatarType === 'custom') {
          setAvatarPreview(userData.avatar);
        }
      } else {
        setNicknameInput('');
        setSelectedAvatar('🐶');
        setAvatarPreview(null);
        setCustomAvatar(null);
      }

      return true;
    } catch (err) {
      console.error('Wallet connect failed:', err);
      return false;
    }
  };

  const updateBalance = async () => {
    if (!contract || !currentAccount) return;
    try {
      const balance = await contract.balanceOf(currentAccount);
      setBalance(ethers.utils.formatUnits(balance, 18));
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const updateRemaining = async () => {
    if (!contract || !currentAccount) return;
    try {
      const remaining = await contract.remainingRewards(currentAccount);
      setRemaining(remaining.toString());
    } catch (error) {
      console.error('Error updating remaining rewards:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentUser) {
      alert('Please register your nickname first');
      return;
    }
    
    const text = messageInput.trim();
    if (!text) return alert('Message cannot be empty');

    if (isSending) return;

    setIsSending(true);

    try {
      const tx = await contract.sendMessage(text);
      await tx.wait();
      
      await userService.sendMessage({
        content: text,
        nickname: currentUser.nickname,
        avatar: currentUser.avatar,
        avatarType: currentUser.avatarType,
        walletAddress: currentAccount,
        anonymous: true
      });
      
      setMessageInput('');
      await updateBalance();
      await updateRemaining();
      
    } catch (err) {
      console.error('Send message failed:', err);
      alert('Failed to send message: ' + (err.message || 'Check console for details'));
    } finally {
      setIsSending(false);
    }
  };

  const startDMChat = async (otherUser) => {
    if (!currentUser) return;
    
    const existingChat = dmChats.find(chat => 
      chat.participants.includes(otherUser.walletAddress.toLowerCase())
    );

    if (!existingChat) {
      setPendingDMUser(otherUser);
      setShowDMSignature(true);
      return;
    }

    const chatId = await userService.getOrCreateDMChat(currentAccount, otherUser.walletAddress);
    setActiveDMChat({
      id: chatId,
      user: otherUser
    });

    if (unsubscribeDMRef.current) unsubscribeDMRef.current();
    unsubscribeDMRef.current = userService.subscribeToPrivateMessages(chatId, (newMessages) => {
      setPrivateMessages(newMessages);
      
      // Highlight user when new DM arrives
      if (newMessages.length > 0) {
        const latestDM = newMessages[newMessages.length - 1];
        if (latestDM.sender !== currentAccount) {
          setHighlightedUser(otherUser.walletAddress);
          setTimeout(() => setHighlightedUser(null), 3000);
        }
      }
    });
  };

  const confirmDMChat = async () => {
    if (!pendingDMUser) return;

    const signature = await requestSignature(
      `Start private chat with ${pendingDMUser.nickname} on HUB Portal`
    );

    if (!signature) {
      alert('DM request cancelled - signature required');
      setShowDMSignature(false);
      setPendingDMUser(null);
      return;
    }

    const chatId = await userService.getOrCreateDMChat(currentAccount, pendingDMUser.walletAddress);
    setActiveDMChat({
      id: chatId,
      user: pendingDMUser
    });

    if (unsubscribeDMRef.current) unsubscribeDMRef.current();
    unsubscribeDMRef.current = userService.subscribeToPrivateMessages(chatId, setPrivateMessages);

    setShowDMSignature(false);
    setPendingDMUser(null);
  };

  const sendPrivateMessage = async () => {
    if (!activeDMChat || !privateMessageInput.trim()) return;

    try {
      await userService.sendPrivateMessage(activeDMChat.id, {
        content: privateMessageInput,
        sender: currentAccount,
        senderNickname: currentUser.nickname,
        senderAvatar: currentUser.avatar,
        senderAvatarType: currentUser.avatarType
      });
      
      setPrivateMessageInput('');
    } catch (err) {
      console.error('Send private message failed:', err);
      alert('Failed to send private message');
    }
  };

  const closeDMChat = () => {
    setActiveDMChat(null);
    setPrivateMessages([]);
    if (unsubscribeDMRef.current) {
      unsubscribeDMRef.current();
      unsubscribeDMRef.current = null;
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const results = await userService.searchUsers(searchQuery);
      console.log('Search results:', results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setCurrentAccount('');
    setCurrentUser(null);
    setBalance('0');
    setRemaining('0');
    setOnlineUsers([]);
    setActiveDMChat(null);
    setPrivateMessages([]);
    setDmChats([]);
    setSearchQuery('');
    setNewMessageNotification(null);
    setHighlightedUser(null);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (unsubscribeDMRef.current) {
      unsubscribeDMRef.current();
      unsubscribeDMRef.current = null;
    }

    setProvider(null);
    setSigner(null);
    setContract(null);
  };

  const canEditProfile = () => {
    return currentAccount.toLowerCase() === CREATOR_ADDRESS.toLowerCase();
  };

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (unsubscribeDMRef.current) unsubscribeDMRef.current();
    };
  }, []);

  const getOtherParticipant = (chat) => {
    if (!currentUser) return null;
    const otherParticipant = chat.participants.find(p => p !== currentAccount.toLowerCase());
    return onlineUsers.find(user => user.walletAddress.toLowerCase() === otherParticipant);
  };

  const filteredOnlineUsers = onlineUsers.filter(user => 
    user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <div className="background-effects">
        <div className="particles"></div>
        <div className="gradient-wave"></div>
      </div>

      {/* New Message Notification */}
      {newMessageNotification && (
        <div className="message-notification">
          <div className="notification-content">
            <span className="notification-icon">💬</span>
            <div className="notification-text">
              <strong>New message from {newMessageNotification.user}</strong>
              <span>{newMessageNotification.message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => setNewMessageNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>
              <img src="/hublogo.svg" alt="HUB Chat" style={{width: '24px', height: '24px', marginRight: '10px', verticalAlign: 'middle'}} />
              HUB Chat
            </h3>
            <div className="online-indicator">
              <span className="dot"></span>
              {onlineUsers.length} online
            </div>
          </div>

          <div className="search-container" style={{marginBottom: '1rem'}}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div className="user-info">
            {currentUser && (
              <>
                <div className="user-avatar" style={{ 
                  fontSize: currentUser.avatarType === 'emoji' ? '1.5rem' : 'inherit',
                  background: currentUser.avatarType === 'emoji' ? 'var(--primary-gradient)' : 'transparent'
                }}>
                  {currentUser.avatarType === 'emoji' ? (
                    currentUser.avatar
                  ) : (
                    <img 
                      src={currentUser.avatar} 
                      alt="Avatar" 
                      style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                    />
                  )}
                </div>
                <div className="user-details">
                  <strong>{currentUser.nickname}</strong>
                  <span>HC: {balance}</span>
                </div>
              </>
            )}
          </div>

          <div className="online-users">
            <h4>Online Users ({filteredOnlineUsers.length})</h4>
            <div className="users-list">
              {filteredOnlineUsers
                .filter(user => user.walletAddress !== currentAccount)
                .map(user => (
                  <div 
                    key={user.walletAddress} 
                    className={`user-item ${activeDMChat?.user?.walletAddress === user.walletAddress ? 'active' : ''} ${
                      highlightedUser === user.walletAddress ? 'highlighted' : ''
                    }`}
                    onClick={() => startDMChat(user)}
                  >
                    <div className="user-avatar" style={{ 
                      fontSize: user.avatarType === 'emoji' ? '1.2rem' : 'inherit',
                      background: user.avatarType === 'emoji' ? 'var(--primary-gradient)' : 'transparent'
                    }}>
                      {user.avatarType === 'emoji' ? (
                        user.avatar
                      ) : (
                        <img 
                          src={user.avatar} 
                          alt="Avatar" 
                          style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                        />
                      )}
                    </div>
                    <span>{user.nickname}</span>
                    <span className="status-dot"></span>
                  </div>
                ))}
            </div>
          </div>

          <div className="sidebar-stats">
            <div className="stat-item">
              <span>Daily Rewards Left:</span>
              <strong>{remaining}/10</strong>
            </div>
            
            {currentUser && canEditProfile() && (
              <button 
                className="disconnect-btn"
                onClick={() => setShowNicknameModal(true)}
                style={{
                  background: 'rgba(0, 255, 208, 0.1)',
                  borderColor: 'var(--accent-green)'
                }}
              >
                ✏️ Edit Profile (Creator)
              </button>
            )}
            
            <button 
              className="disconnect-btn"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="main-header">
            <div className="header-content">
              <h1>
                <img src="/hublogo.svg" alt="HUB Portal" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                HUB Portal
              </h1>
              <div className="header-stats">
                <span>💎 HC: {balance}</span>
                <span>🎯 Left: {remaining}/10</span>
              </div>
            </div>
          </header>

          <section className="chat-container">
            <div className="messages-container">
              {messages.map(msg => (
                <div key={msg.id} className="message-bubble">
                  <div className="message-header">
                    <div className="user-avatar" style={{ 
                      fontSize: msg.avatarType === 'emoji' ? '1.2rem' : 'inherit',
                      background: msg.avatarType === 'emoji' ? 'var(--primary-gradient)' : 'transparent'
                    }}>
                      {msg.avatarType === 'emoji' ? (
                        msg.avatar
                      ) : (
                        <img 
                          src={msg.avatar} 
                          alt="Avatar" 
                          style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                        />
                      )}
                    </div>
                    <strong>{msg.nickname}</strong>
                    <span className="message-time">
                      {msg.timestamp?.toDate ? 
                        msg.timestamp.toDate().toLocaleTimeString() : 
                        new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <textarea 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message in public chat..."
                disabled={isSending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button 
                onClick={sendMessage}
                disabled={isSending || !messageInput.trim()}
                className="send-button"
              >
                {isSending ? '⏳' : '🚀'}
              </button>
            </div>
          </section>
        </main>

        {/* DM Chat Panel */}
        {activeDMChat && (
          <aside className="dm-panel">
            <div className="dm-header">
              <div className="dm-user-info">
                <div className="user-avatar" style={{ 
                  fontSize: activeDMChat.user.avatarType === 'emoji' ? '1.2rem' : 'inherit',
                  background: activeDMChat.user.avatarType === 'emoji' ? 'var(--primary-gradient)' : 'transparent'
                }}>
                  {activeDMChat.user.avatarType === 'emoji' ? (
                    activeDMChat.user.avatar
                  ) : (
                    <img 
                      src={activeDMChat.user.avatar} 
                      alt="Avatar" 
                      style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                    />
                  )}
                </div>
                <div>
                  <strong>{activeDMChat.user.nickname}</strong>
                  <span className="online-status">Online</span>
                </div>
              </div>
              <button className="close-dm" onClick={closeDMChat}>×</button>
            </div>

            <div className="dm-messages">
              {privateMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`dm-message ${msg.sender === currentAccount ? 'own-message' : 'other-message'}`}
                >
                  <div className="dm-message-content">
                    {msg.content}
                  </div>
                  <div className="dm-message-time">
                    {msg.timestamp?.toDate ? 
                      msg.timestamp.toDate().toLocaleTimeString() : 
                      new Date().toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="dm-input-container">
              <textarea 
                value={privateMessageInput}
                onChange={(e) => setPrivateMessageInput(e.target.value)}
                placeholder={`Message ${activeDMChat.user.nickname}...`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendPrivateMessage();
                  }
                }}
              />
              <button 
                onClick={sendPrivateMessage}
                disabled={!privateMessageInput.trim()}
                className="send-dm-button"
              >
                ➤
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Onboarding Modal with Avatar Selection */}
      {showNicknameModal && (
        <div className="modal-overlay">
          <div className="onboarding-modal">
            
            {/* Nickname Warning - teraz na górze */}
            {!currentUser && (
              <div className="nickname-warning-banner">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <strong>Important: Your nickname cannot be changed later!</strong>
                  <span>Choose wisely as this will be your permanent identity in HUB Portal.</span>
                </div>
              </div>
            )}

            <div className="modal-header">
              <h2>{currentUser ? 'Edit Profile' : 'Welcome to HUB Portal!'} 🎉</h2>
              <p>{currentUser ? 'Update your profile' : 'Create your identity'}</p>
            </div>
            
            <div className="modal-content">
              <div className="avatar-selection-section">
                <h4>Choose your avatar:</h4>
                
                <div style={{marginBottom: '1rem', textAlign: 'center'}}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    style={{display: 'none'}}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      marginBottom: '1rem'
                    }}
                  >
                    📁 Upload Custom Avatar (max 0.5MB)
                  </button>
                  
                  {avatarPreview && (
                    <div style={{textAlign: 'center', marginBottom: '1rem'}}>
                      <img 
                        src={avatarPreview} 
                        alt="Preview" 
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--accent-green)'
                        }}
                      />
                      <p style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem'}}>
                        Custom Avatar Selected
                      </p>
                    </div>
                  )}
                </div>

                <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center'}}>
                  Or choose from emojis:
                </p>
                <div className="avatar-grid">
                  {AVAILABLE_AVATARS.map((avatar, index) => (
                    <div
                      key={`${avatar}_${index}`}
                      className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAvatar(avatar);
                        setCustomAvatar(null);
                        setAvatarPreview(null);
                      }}
                    >
                      {avatar}
                    </div>
                  ))}
                </div>
              </div>
              
              <input 
                type="text" 
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter your nickname..."
                maxLength={20}
                className="nickname-input"
              />
              
              <button 
                onClick={registerNickname}
                disabled={nicknameInput.length < 3}
                className="confirm-button"
              >
                {currentUser ? 'Update Profile' : 'Join HUB Portal'} 🚀
              </button>
            </div>
            
            <div className="modal-footer">
              <p>Earn HC tokens for every message! 💎</p>
            </div>
          </div>
        </div>
      )}

      {showDMSignature && (
        <div className="modal-overlay">
          <div className="onboarding-modal">
            <div className="modal-header">
              <h2>Start Private Chat 🔒</h2>
              <p>Signature required for first message</p>
            </div>
            
            <div className="modal-content">
              <div style={{textAlign: 'center', marginBottom: '2rem'}}>
                <div className="user-avatar" style={{ 
                  fontSize: pendingDMUser?.avatarType === 'emoji' ? '3rem' : 'inherit',
                  background: pendingDMUser?.avatarType === 'emoji' ? 'var(--primary-gradient)' : 'transparent',
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 1rem'
                }}>
                  {pendingDMUser?.avatarType === 'emoji' ? (
                    pendingDMUser?.avatar
                  ) : (
                    <img 
                      src={pendingDMUser?.avatar} 
                      alt="Avatar" 
                      style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                    />
                  )}
                </div>
                <h3 style={{color: 'var(--text-primary)', marginBottom: '0.5rem'}}>
                  {pendingDMUser?.nickname}
                </h3>
                <p style={{color: 'var(--text-secondary)'}}>
                  Start a private conversation
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '2rem'
              }}>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center'}}>
                  🔐 <strong>First message requires wallet signature</strong><br/>
                  This verifies your identity and prevents spam. Subsequent messages won't need signatures.
                </p>
              </div>
              
              <div style={{display: 'flex', gap: '1rem'}}>
                <button 
                  onClick={() => {
                    setShowDMSignature(false);
                    setPendingDMUser(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDMChat}
                  className="confirm-button"
                  style={{flex: 1, margin: 0}}
                >
                  Sign & Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!walletConnected && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <img src="/hublogo.svg" alt="HUB Portal" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
            <h1>HUB Portal</h1>
            <p>Decentralized Social Chat on Celo</p>
            <button 
              onClick={connectWallet}
              className="connect-wallet-btn"
            >
              Connect Wallet 🦊
            </button>
            <div className="features">
              <span>💎 Earn HC Tokens</span>
              <span>🔒 Private Messages</span>
              <span>🌍 Celo Network</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;