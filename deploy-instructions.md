# HelloCeloToken - Deployment & Testing Instructions

## Requirements

- MetaMask with selected network:
  - Test: **Celo Alfajores**
    - RPC: https://alfajores-forno.celo-testnet.org
    - ChainID: 44787
  - Mainnet: https://forno.celo.org (ChainID: 42220)
- CELO for gas fees
- Remix IDE: https://remix.ethereum.org

---

## Deploy Contract

1. In Remix, create file `contracts/HelloCelo.sol`
2. Paste the smart contract code
3. Compile with Solidity `0.8.20`
4. Deploy:
   - Environment: **Injected Provider - MetaMask**
   - No constructor parameters needed
   - Confirm transaction in MetaMask

---

## Test Functions

- `sendMessage("Hello Celo!")` → send message and mint 1 HC
- `balanceOf(address)` → check token balance
- `remainingRewards(address)` → remaining rewards today (max 10)
- `getMessageCount()` → number of messages
- `getAllMessages()` → list of messages

---

## Security

- Token parameters immutable (`REWARD_PER_MESSAGE`, `MAX_SUPPLY`)
- Daily reward limit: 10 per address
- Owner can pause/unpause contract
- Anti-bot: only EOAs can receive rewards
