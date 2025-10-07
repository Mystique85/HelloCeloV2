# HelloCeloToken

HelloCeloToken is an innovative project on the **Celo blockchain**, combining an **ERC20 token HC** with a **message board**.  
Users can post messages and receive **HC tokens** as a reward.

---

## Key Features

- Token: **HelloCelo (HC)**, ERC20 standard  
- Reward: **1 HC** per message  
- Maximum supply: **1,000,000 HC** (immutable)  
- Daily limit: **10 rewards per day per address**  
- Security: anti-spam, anti-bot, immutable token parameters  
- Transparency: all rules enforced on-chain  

---

## How to Use

1. Send a message: `sendMessage("Your message")`  
2. Check token balance: `balanceOf(address)`  
3. Check remaining rewards today: `remainingRewards(address)`  
4. Get total messages: `getMessageCount()`  
5. Retrieve all messages (may be expensive): `getAllMessages()`

---

## Deployment / Contract Address

Currently deployed on **Celo Mainnet**:  

- **Contract Address:** `0x12b6e1f30cb714e8129F6101a7825a910a9982F2`  
- Immutable parameters:
  - `REWARD_PER_MESSAGE = 1 HC`
  - `MAX_SUPPLY = 1,000,000 HC`
  - `MAX_DAILY_REWARDS = 10`

Full deployment guide is available in [`deploy-instructions.md`](deploy-instructions.md).

---

## License

MIT License
