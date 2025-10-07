// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title HelloCelo - Message board + ERC20 reward token "HelloCelo (HC)"
/// @notice Each sendMessage() call mints a fixed reward to the sender (1 HC).
/// @dev Reward and max supply are immutable (constants). Each address can receive reward
///      at most 10 times per UTC day (24h window defined by Unix day).
contract HelloCelo {
    // --- ERC20 token parameters ---
    string public name = "HelloCelo";
    string public symbol = "HC";
    uint8 public decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // --- Immutable economic parameters ---
    uint256 public constant REWARD_PER_MESSAGE = 1e18; // 1 HC (1 * 10^18)
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 1_000_000 HC

    // --- Ownership & control ---
    address public owner;
    bool public paused;

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // --- Message storage ---
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
    }

    Message[] private messages;

    event MessageSent(address indexed sender, string content, uint256 timestamp, uint256 reward);
    event RewardClaimed(address indexed sender, uint256 reward, uint256 remainingToday);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // --- Rate limiting per address ---
    // We count claims per UTC day. Use day index = block.timestamp / 1 days.
    mapping(address => uint256) public dailyCount;
    mapping(address => uint256) public lastDayIndex;

    uint256 public constant MAX_DAILY_REWARDS = 10;

    // --- Constructor ---
    constructor() {
        owner = msg.sender;
        paused = false;
    }

    // --- ERC20 standard functions (minimal implementation) ---
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        unchecked {
            balanceOf[msg.sender] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        unchecked {
            allowance[from][msg.sender] -= amount;
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
        return true;
    }

    // --- Internal minting with maxSupply check ---
    function _mint(address to, uint256 amount) internal {
        // respect MAX_SUPPLY (constant)
        require(totalSupply + amount <= MAX_SUPPLY, "Max supply reached");
        unchecked {
            totalSupply += amount;
            balanceOf[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    // Owner may burn tokens from an address (optional admin power)
    function ownerBurn(address from, uint256 amount) external onlyOwner {
        require(balanceOf[from] >= amount, "Balance too low");
        unchecked {
            balanceOf[from] -= amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    // Rescue other ERC20 tokens sent accidentally (not HC)
    function rescueERC20(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot rescue HC token");
        (bool success, ) = tokenAddress.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(success, "Rescue failed");
    }

    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Pause / unpause message sending (reward minting)
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // --- Message board and reward logic ---

    /// @notice Send a message and receive the fixed reward (1 HC) if the sender has not exceeded daily quota.
    /// @dev The rate limit is MAX_DAILY_REWARDS per UTC day per address.
    function sendMessage(string calldata _content) external whenNotPaused {
        require(bytes(_content).length > 0, "Message cannot be empty");
        require(bytes(_content).length <= 280, "Message too long");

        // Optional anti-contract protection (prevent contracts from calling):
        // If you want to allow contracts, remove the next line.
        require(msg.sender == tx.origin, "Contracts not allowed");

        // Determine current UTC day index
        uint256 dayIndex = block.timestamp / 1 days;

        if (lastDayIndex[msg.sender] != dayIndex) {
            // new day -> reset counter
            lastDayIndex[msg.sender] = dayIndex;
            dailyCount[msg.sender] = 0;
        }

        require(dailyCount[msg.sender] < MAX_DAILY_REWARDS, "Daily reward limit reached");

        // Record message
        messages.push(Message(msg.sender, _content, block.timestamp));
        emit MessageSent(msg.sender, _content, block.timestamp, REWARD_PER_MESSAGE);

        // Mint reward (1 HC) and update counters
        _mint(msg.sender, REWARD_PER_MESSAGE);
        dailyCount[msg.sender] += 1;

        uint256 remaining = MAX_DAILY_REWARDS - dailyCount[msg.sender];
        emit RewardClaimed(msg.sender, REWARD_PER_MESSAGE, remaining);
    }

    /// @notice Returns all messages (careful: may be large)
    function getAllMessages() external view returns (Message[] memory) {
        return messages;
    }

    /// @notice Returns total number of messages
    function getMessageCount() external view returns (uint256) {
        return messages.length;
    }

    /// @notice How many rewards the user has left for the current UTC day
    function remainingRewards(address user) external view returns (uint256) {
        uint256 dayIndex = block.timestamp / 1 days;
        if (lastDayIndex[user] != dayIndex) {
            return MAX_DAILY_REWARDS;
        } else {
            return MAX_DAILY_REWARDS - dailyCount[user];
        }
    }
}
