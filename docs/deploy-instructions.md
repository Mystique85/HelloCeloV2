# HelloCeloToken - Deployment Instructions

## Requirements

- MetaMask with selected network: **Celo Mainnet**
  - RPC: https://forno.celo.org
  - ChainID: 42220
- CELO for gas fees
- Remix IDE: https://remix.ethereum.org

---

## Deploy Contract

1. In Remix, create file `contracts/HelloCelo.sol`.
2. Paste the smart contract code into the file.
3. Compile with Solidity `0.8.20`.
4. Deploy the contract:
   - Environment: **Injected Provider - MetaMask**
   - Constructor parameters: none
   - Confirm transaction in MetaMask.
5. After deployment, note the deployed contract address.

**Mainnet Deployed Contract Address:**  
`0x12b6e1f30cb714e8129F6101a7825a910a9982F2`

---

## Post-Deployment Verification

- Make sure the contract is deployed successfully on Celo Mainnet.
- Check the contract on [Celo Blockscout](https://celo.blockscout.com/address/0x12b6e1f30cb714e8129F6101a7825a910a9982F2).

---

## Security Notes

- Token parameters (`REWARD_PER_MESSAGE`, `MAX_SUPPLY`) are immutable.
- Daily reward limit: 10 per address.
- Owner can pause/unpause contract.
- Only EOAs (Externally Owned Accounts) can receive rewards (anti-bot protection).

---

## Testing Functions

- `sendMessage("Hello Celo!")` → send a message and mint 1 HC.
- `balanceOf(address)` → check token balance.
- `remainingRewards(address)` → remaining rewards today (max 10 per day).
- `getMessageCount()` → number of messages sent.
- `getAllMessages()` → list of messages.
