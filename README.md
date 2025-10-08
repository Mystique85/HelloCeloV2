# HelloCelo DApp

**HelloCelo** is an innovative project on the **Celo blockchain**, combining an **ERC20 token (HC)** with a simple **message board**.  
Users can post messages and receive **HC tokens** as a reward.

---

## 🌟 Key Features

- **Token:** HelloCelo (HC), ERC20 standard  
- **Symbol:** HC  
- **Decimals:** 18 (`decimals = 18`)  
- **Reward per message:** 1 HC (`REWARD_PER_MESSAGE`)  
- **Maximum supply:** 1,000,000 HC (`MAX_SUPPLY`)  
- **Daily limit:** 10 rewards per address per day (`MAX_DAILY_REWARDS`)  
- **Security:**  
  - Anti-spam and bot protection  
  - Maximum message length: 280 characters  
  - Contract calls blocked (only real accounts can send messages)  
- **Transparency:** all rules enforced on-chain  

---

## 🖥️ How to Use the DApp

1. **Open the HelloCelo application** in your browser (link in "Useful Links" section).  
2. **Connect your Celo wallet**  
   - Supported wallets: MetaMask, Rabby, Celo Extension Wallet  
   - Click the `Connect Wallet` button in the app  

3. **Send a message**  
   - Type your message in the text box and click `Send Message`  
   - You will receive **1 HC** as a reward if you haven't exceeded your daily limit  

4. **Check your HC balance**  
   - Your balance updates automatically after sending a message  

5. **Check remaining daily rewards**  
   - The `Remaining Daily Rewards` field shows how many rewards you can still claim today  
   - Counter resets every UTC day  

6. **Browse messages**  
   - The `Messages` section displays all messages sent in the DApp  
   - Each message shows **sender address**, **content**, and **timestamp**  

---

### ℹ️ HC Token Mechanics

- **ERC20 minimal standard** – supports transfers, balances, approve/allowance  
- **Minting:** 1 HC is automatically minted to the user’s address after sending a message  
- **Max supply:** total supply cannot exceed 1,000,000 HC  
- **Daily limit:** maximum 10 rewards per address per UTC day  
- **Counter reset:** daily rewards counter resets at midnight UTC  
- **Contract calls blocked:** only real accounts can send messages (prevents spam)  

---

### Mainnet Contract

- **Contract Address:** `0x12b6e1f30cb714e8129F6101a7825a910a9982F2`  
- All rules above are enforced on-chain  

---

## 📜 License

This project is released under the **MIT License**.  

---

## 📖 Useful Links

- **DApp:** [https://mystique85.github.io/HelloCeloV2/](https://mystique85.github.io/HelloCeloV2/)  
- [Celo Docs](https://docs.celo.org/)  
- [Ethers.js Docs](https://docs.ethers.org/v5/)  


## 🤝 Contributing
We welcome feedback and contributions!  
Please check out our [Contributing Guide](./CONTRIBUTING.md) for more details.
