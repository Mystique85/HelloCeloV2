# HelloCeloToken

HelloCeloToken is an innovative Celo blockchain project combining an **ERC20 token HC** with a **message board**.  
Users can post messages and receive **HC tokens** as a reward.

---

## Key Features

- Token: **HelloCelo (HC)**, ERC20 standard
- Reward: **1 HC** per message
- Maximum supply: **1,000,000 HC** (immutable)
- Daily limit: **10 rewards per day per address**
- Secure and professional: anti-spam, anti-bot, immutable token parameters
- Transparent: all rules encoded on-chain

---

## How to Use

1. Send a message with `sendMessage("Your message")`  
2. Check token balance: `balanceOf(address)`  
3. Check remaining rewards today: `remainingRewards(address)`  
4. Get total messages: `getMessageCount()`  
5. Retrieve all messages (may be expensive): `getAllMessages()`

---

## Deployment

Deployed on Celo (Alfajores testnet or mainnet).  
Parameters are **immutable**:

- `REWARD_PER_MESSAGE = 1 HC`
- `MAX_SUPPLY = 1,000,000 HC`
- `MAX_DAILY_REWARDS = 10`

See [`deploy-instructions.md`](deploy-instructions.md) for full deployment guide.

---

## License

MIT License
