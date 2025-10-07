# HelloCeloToken - Smart Contract Detailed Description

HelloCeloToken is an innovative **ERC20 reward token** integrated with a **decentralized message board** on the Celo blockchain.  
This document provides a detailed overview of how the smart contract works, its tokenomics, reward mechanics, security measures, and user interactions.

---

## 1. Overview

HelloCeloToken (HC) is designed to **encourage user interaction on-chain** by rewarding participants with tokens for each transaction (message submission).  

Key objectives:

- Provide a simple, secure, and transparent reward system.  
- Limit potential abuse via daily reward caps.  
- Maintain a fixed maximum token supply to ensure scarcity.  
- Combine a functional message board with an ERC20 token economy.

---

## 2. Core Functionality

The smart contract combines two main features:

1. **Message Board**
   - Users can post messages to the blockchain via the `sendMessage(string _content)` function.
   - Each message must be between 1 and 280 characters.
   - Messages are stored in an on-chain array with the sender’s address and timestamp.
   - Events are emitted on each message submission (`MessageSent` and `RewardClaimed`) for front-end integration.

2. **ERC20 Reward Token**
   - The token `HelloCelo (HC)` follows the ERC20 standard:
     - `name = "HelloCelo"`
     - `symbol = "HC"`
     - `decimals = 18`
   - Each valid message submission mints **1 HC token** to the sender’s address.
   - Total supply is capped at **1,000,000 HC** and is immutable.

---

## 3. Reward Mechanics

### 3.1 Daily Reward Limit
- Each address can receive rewards **up to 10 times per UTC day**.
- The contract tracks the number of rewards claimed per day for each address.
- If the daily limit is reached, further message submissions **do not mint additional tokens**, but the message is still recorded.

### 3.2 Minting Logic
- `_mint(address to, uint256 amount)` checks that total supply does not exceed `MAX_SUPPLY`.
- Once max supply is reached, no additional tokens can be minted.

### 3.3 Anti-bot Measures
- Only externally owned accounts (EOAs) can receive rewards.  
- Contracts calling `sendMessage` will be blocked.

### 3.4 Events
- `MessageSent(address sender, string content, uint256 timestamp, uint256 reward)`  
- `RewardClaimed(address sender, uint256 reward, uint256 remainingToday)`  

Events allow front-end applications to display real-time activity and rewards.

---

## 4. Tokenomics

| Parameter               | Value                        |
|-------------------------|------------------------------|
| Token Name              | HelloCelo                    |
| Symbol                  | HC                           |
| Decimals                | 18                           |
| Maximum Supply          | 1,000,000 HC                 |
| Reward per Message      | 1 HC                         |
| Daily Reward Limit      | 10 per address               |
| Minting Mechanism       | Message submission           |
| Owner Control           | Pause/unpause contract       |
| Immutable Parameters    | Reward, Max Supply           |

---

## 5. Security & Ownership

- **Owner** can:
  - Pause/unpause the contract to mitigate unexpected issues.
  - Rescue ERC20 tokens accidentally sent to the contract (except HC).
- **Immutable Parameters**:
  - `REWARD_PER_MESSAGE` (1 HC)
  - `MAX_SUPPLY` (1,000,000 HC)
- **Anti-spam & Anti-bot**:
  - Daily limit prevents abuse.
  - Only EOAs can claim rewards; smart contracts are blocked.
- **Transparency**:
  - All rules and balances are enforced on-chain.
  - Events make front-end tracking simple and auditable.

---

## 6. User Interaction

### 6.1 Posting a Message

## 7. Events & Front-end

- `MessageSent(address sender, string content, uint256 timestamp, uint256 reward)`  
  Triggered for each message submission. Front-end can listen to this event to display new messages in real-time.

- `RewardClaimed(address sender, uint256 reward, uint256 remainingToday)`  
  Triggered when a reward is minted for a user. Front-end can show the updated token balance and remaining daily rewards.

These events allow seamless integration with front-end applications, enabling **real-time tracking** of messages and token rewards.

---

## 8. Summary

HelloCeloToken is **secure, transparent, and engaging**.  

- Users can post messages and earn HC tokens.  
- Daily reward limit: 10 per address.  
- Token parameters (reward per message and max supply) are **immutable**.  
- Anti-abuse mechanisms prevent spam and bot activity.  
- All rules are enforced on-chain, ensuring fairness and transparency.

## 9. Contract Address on Celo Mainnet

- HelloCeloToken (HC) deployed at: `0x12b6e1f30cb714e8129F6101a7825a910a9982F2`
- Users can interact via `sendMessage`, check balances, and view messages.

