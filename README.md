# Rock Paper Scissors Lizard Spock - Web3 Game

A decentralized blockchain-based implementation of the classic Rock Paper Scissors Lizard Spock game using Web3 technology and smart contracts.

## 🎮 What is this?

This is a Web3 version of the popular "Rock Paper Scissors Lizard Spock" game, made famous by The Big Bang Theory. The game runs on the Ethereum blockchain using smart contracts to ensure fair play and secure transactions.

## 🚀 Features

- **Blockchain-based**: Secure, transparent, and tamper-proof gameplay
- **Commit-Reveal Scheme**: Prevents cheating by hiding moves until both players have committed
- **Real Money Stakes**: Play with real ETH on any Ethereum network
- **Smart Contract Integration**: Automated game logic and payouts
- **MetaMask Integration**: Easy wallet connection and transaction management
- **Responsive Design**: Works on desktop and mobile devices

## 🎯 How to Play

### Game Rules
The game extends traditional Rock Paper Scissors with two additional moves:

- **Rock (🪨)** beats Scissors and Lizard
- **Paper (📄)** beats Rock and Spock  
- **Scissors (✂️)** beats Paper and Lizard
- **Lizard (🦎)** beats Spock and Paper
- **Spock (🖖)** beats Scissors and Rock

### Game Flow

1. **Create Game**: Player 1 creates a game with a commitment (hidden move) and stake
2. **Join Game**: Player 2 joins using the contract address and makes their move
3. **Reveal Move**: Player 1 reveals their move to determine the winner
4. **Payout**: Winner receives the total stake, or it's split on a tie

## 🛠️ Getting Started

### Prerequisites

- MetaMask browser extension
- Any Ethereum network (mainnet, testnet, or local)
- **For contract deployment**: Hardhat or similar development environment

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RPS-extended
   ```

2. **For contract deployment (required for game creation)**
   ```bash
   npm install --save-dev hardhat
   npx hardhat compile
   ```

3. **Open the application**
   - Simply open `public/index.html` in your browser
   - Or SERVE it using any local web server (npx serve public -l 3000)

4. **Connect MetaMask**
   - Make sure MetaMask is installed and unlocked
   - Connect to your preferred Ethereum network
   - Ensure you have ETH for gas fees and stakes

### ⚠️ Important Note

**Game creation requires compiled contract bytecode.** The current setup will show an error when trying to create games because the RPS.sol contract needs to be compiled first.

**To enable game creation, choose one option:**

**🔧 Option 1: Use Hardhat**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat compile
# Copy bytecode from artifacts/contracts/RPS.sol/RPS.json
# Update deployment code in public/app.js
```
## 🎮 How to Use

### Creating a Game

1. **Connect Wallet**: Click "Connect MetaMask" and approve the connection
2. **Create Game**: 
   - Enter opponent's wallet address
   - Set stake amount in ETH
   - Select your move (Rock, Paper, Scissors, Lizard, or Spock)
   - Click "Create Game"
3. **Share Contract**: Share the generated contract address with your opponent

### Joining a Game

1. **Get Contract Address**: Receive the contract address from the game creator
2. **Load Game**: Enter the contract address and click "Load Game Details"
3. **Join Game**: Select your move and click "Join Game"
4. **Wait for Reveal**: Wait for the creator to reveal their move

### Revealing Moves

1. **Go to My Games**: Click on "My Games" tab
2. **Find Your Game**: Look for games with "Ready to reveal" status
3. **Reveal Move**: Click "Reveal Move" and enter your original move and salt
4. **Get Results**: The winner is determined and funds are distributed

## 🔧 Technical Details

### Smart Contract

The game uses the original RPS.sol contract with the following key functions:

- **Constructor**: Creates a new game with commitment and opponent
- **play()**: Allows player 2 to join and make their move
- **solve()**: Allows player 1 to reveal their move and determine winner
- **Timeout functions**: Handle cases where players don't respond

### Security Features

- **Commit-Reveal Scheme**: Moves are hidden until both players commit
- **Cryptographic Hashing**: Uses keccak256 for move commitments
- **Timeout Protection**: Prevents games from being stuck indefinitely
- **Automatic Payouts**: Smart contract handles all fund distribution

## 🌐 Network Support

The game works on any Ethereum-compatible network:

- **Ethereum Mainnet**: Real ETH stakes
- **Ethereum Testnets**: Sepolia, Goerli, etc.
- **Local Networks**: Hardhat, Ganache, etc.
- **Layer 2 Solutions**: Polygon, Arbitrum, etc.

## 🎯 Game Strategy

### Tips for Players

1. **Choose Your Stakes Wisely**: Only stake what you can afford to lose
2. **Keep Your Salt Safe**: You need it to reveal your move
3. **Check Network Fees**: Gas costs vary by network
4. **Verify Opponents**: Make sure you trust the person you're playing against

### Common Scenarios

- **Tie Games**: Stakes are returned to both players
- **Timeout**: If a player doesn't respond, the other can claim the funds
- **Network Issues**: Transactions may fail due to network congestion

## 🚨 Important Notes

- **Gas Fees**: Each transaction requires ETH for gas fees
- **Network Congestion**: High network usage may cause delays
- **Permanent Moves**: Once committed, moves cannot be changed
- **Smart Contract Risk**: While audited, smart contracts carry inherent risks

## 🤝 Contributing

This project uses the original RPS.sol contract exactly as provided. The frontend is built with vanilla JavaScript and Web3.js for maximum compatibility.

## 📄 License

This project uses the original RPS.sol contract under the WTFPL license. See the contract file for details.

## 🆘 Support

If you encounter issues:

1. **Check MetaMask**: Ensure it's connected and unlocked
2. **Verify Network**: Make sure you're on the correct network
3. **Check Gas**: Ensure you have enough ETH for gas fees
4. **Browser Console**: Check for error messages in the browser console

---

**Happy Gaming! 🎮✨**