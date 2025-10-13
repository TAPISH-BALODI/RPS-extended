# Migration Guide - RPS Extended v2.0

This guide helps you understand the changes and how to work with the codebase.

## 🗂️ New File Structure

```
public/
├── index.html                  # Main HTML (updated with Web3Modal)
├── style.css                   # Styles (updated with new classes)
├── app.js                      # Main entry point (ES6 module)
├── utils/
│   ├── constants.js           # All constants and configuration
│   ├── validation.js          # Validation helper functions
│   └── crypto.js              # Cryptographic utilities
└── managers/
    ├── WalletManager.js       # Wallet connection (Web3Modal)
    ├── ContractManager.js     # Smart contract interactions
    ├── GameManager.js         # Game state management
    └── UIManager.js           # UI updates and rendering
```

## 📦 Module Overview

### `app.js` - Main Entry Point
```javascript
// Initializes all managers and sets up callbacks
// Exposes rpsUI globally for onclick handlers
```

### `utils/constants.js`
```javascript
// Exports:
- CHAIN_IDS: Supported network chain IDs
- NETWORK_NAMES: Human-readable network names
- TIMEOUT_DURATION: 5 minutes in milliseconds
- POLLING_INTERVAL: 10 seconds
- GAME_STATES: Enum for game states
- MOVE_NAMES, MOVE_ICONS, MOVE_MAPPING
- CONTRACT_ABI, CONTRACT_BYTECODE
```

### `utils/validation.js`
```javascript
// Exports:
- isValidEthereumAddress(address): Validates address format
- validateStakeAmount(stake): Validates stake with warnings
- shortenAddress(address): Display format (0x1234...5678)
- isTimeoutElapsed(timestamp): Check if 5 min passed
- getTimeRemaining(timestamp): Get milliseconds remaining
- formatTimeRemaining(ms): Format as "4:30"
```

### `utils/crypto.js`
```javascript
// Exports:
- generateSecureRandom(): Generate secure salt
- createCommitment(web3, move, salt): Create hash
- doesMoveWin(move1, move2): Game logic
```

### `managers/WalletManager.js`
```javascript
class WalletManager {
  // Methods:
  async init(): Initialize Web3Modal
  async connect(): Connect wallet
  async disconnect(): Disconnect wallet
  getAccount(): Get current account
  getChainId(): Get current chain ID
  getNetworkName(): Get network name
  async getBalance(): Get ETH balance
  isConnected(): Check connection status
  getWeb3(): Get Web3 instance
  
  // Callbacks:
  onAccountChange(callback)
  onChainChange(callback)
  onConnect(callback)
  onDisconnect(callback)
}
```

### `managers/ContractManager.js`
```javascript
class ContractManager {
  // Methods:
  async deployGame(opponent, stake, move, salt)
  async joinGame(gameAddress, move)
  async revealMove(gameAddress, move, salt)
  async claimTimeout(gameAddress, timeoutType)
  async getGameDetails(gameAddress)
  async isGameCompleted(gameAddress)
}
```

### `managers/GameManager.js`
```javascript
class GameManager {
  // Methods:
  async createGame(opponent, stake, move)
  async joinGame(gameAddress, move)
  async revealMove(gameId, move, salt)
  async claimTimeout(gameId, timeoutType)
  getAllGames()
  getActiveGames()
  getCompletedGames()
  getGame(gameId)
  clearAllGames()
  startPolling()
  stopPolling()
  async updateGameStates()
  
  // Callbacks:
  onGameUpdate(callback)
}
```

### `managers/UIManager.js`
```javascript
class UIManager {
  // Methods:
  init()
  updateWalletUI()
  updateGamesList()
  openRevealModal(gameId)
  closeRevealModal()
  claimTimeout(gameId, timeoutType)
  viewGameDetails(gameId)
  showMessage(message, type, duration)
  
  // Internal:
  setupEventListeners()
  handleCreateGame(e)
  handleJoinGame()
  handleRevealMove()
  renderGameItem(game)
  startTimeoutTimer(gameId, lastAction, btnId)
  // ... and more
}
```

## 🔄 How Data Flows

```
User Action (UI)
    ↓
UIManager (handles event)
    ↓
GameManager (manages state)
    ↓
ContractManager (blockchain call)
    ↓
WalletManager (Web3 provider)
    ↓
Blockchain
    ↓
GameManager (polling detects change)
    ↓
UIManager (updates display)
```

## 🎯 Key Concepts

### 1. Automatic Polling
```javascript
// GameManager starts polling when wallet connects
gameManager.startPolling(); // Every 10 seconds

// Polling checks all active games for:
// - Player 2 joining
// - Game completion
// - State changes
```

### 2. Event-Driven Architecture
```javascript
// Managers emit events via callbacks
walletManager.onAccountChange(() => {
  // Update UI when account changes
});

gameManager.onGameUpdate(() => {
  // Refresh games list when state updates
});
```

### 3. Loading States
```javascript
// All async operations show loading
uiManager.setButtonLoading(button, true);
try {
  await someAsyncOperation();
} finally {
  uiManager.setButtonLoading(button, false);
}
```

### 4. Validation Before Submit
```javascript
// Real-time validation
input.addEventListener('input', (e) => {
  if (isValidEthereumAddress(e.target.value)) {
    enableSubmitButton();
  }
});
```

## 🧪 Testing Locally

### 1. Start Local Server
```bash
# Use any static server
npx http-server public/

# Or Python
python -m http.server 8080

# Or Node.js serve
npx serve public/
```

### 2. Access Application
```
Open: http://localhost:8080
```

### 3. Test Features

#### ✅ Wallet Connection
1. Click "Connect MetaMask"
2. Approve connection in Web3Modal popup
3. Should show address, balance, network

#### ✅ Address Validation
1. Go to "Create Game"
2. Type invalid address (e.g., "0x123")
3. Should see red border, button disabled
4. Type valid address (0x + 40 hex chars)
5. Button should enable when move selected

#### ✅ Create Game
1. Enter valid opponent address
2. Enter stake amount (any amount works now)
3. Select a move
4. Click "Create Game"
5. Should show loading, then success
6. Game appears in "My Games" tab

#### ✅ Automatic Updates
1. Create a game
2. Have opponent join from another account
3. Wait up to 10 seconds
4. Game state should auto-update to "Ready to reveal"

#### ✅ Timeout Countdown
1. Create a game (opponent doesn't join)
2. Click "My Games"
3. Should see "Claim Timeout (4:59)" counting down
4. Button disabled until 5:00 elapsed
5. After 5 min, shows "(Available now)" and enables

#### ✅ Reveal Move
1. As Player 1, after Player 2 joins
2. Click "Reveal Move"
3. Modal shows your move (disabled selector)
4. Salt auto-filled
5. Click "Reveal Move"
6. Game completes, shows winner

## 🔧 Customization

### Change Polling Interval
```javascript
// utils/constants.js
export const POLLING_INTERVAL = 5000; // 5 seconds instead of 10
```

### Add New Network
```javascript
// utils/constants.js
export const CHAIN_IDS = {
  HARDHAT: '0x7a69',
  SEPOLIA: '0xaa36a7',
  GOERLI: '0x5',  // Add new network
  MAINNET: '0x1'
};

export const NETWORK_NAMES = {
  [CHAIN_IDS.GOERLI]: 'Goerli Testnet'  // Add name
};
```

### Customize Timeout Duration
```javascript
// utils/constants.js
export const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes
```

### Change Stake Validation
```javascript
// utils/validation.js
export function validateStakeAmount(stake) {
  const stakeNum = parseFloat(stake);
  
  if (stakeNum <= 0) {
    return { valid: false, message: 'Must be positive' };
  }
  
  if (stakeNum < 0.001) {
    return { valid: false, message: 'Minimum 0.001 ETH' };
  }
  
  return { valid: true };
}
```

## 🐛 Debugging

### Check Module Loading
```javascript
// Open browser console
// Should see modules loading without errors
```

### View Current State
```javascript
// In console:
window.rpsUI.gameManager.getAllGames()
window.rpsUI.walletManager.getAccount()
window.rpsUI.walletManager.getNetworkName()
```

### Enable Debug Logging
```javascript
// Add to any manager constructor:
this.debug = true;

// Add to methods:
if (this.debug) console.log('Debug info:', data);
```

## 🚨 Common Issues

### Issue: "Cannot use import statement outside a module"
**Solution:** Ensure script tag has `type="module"`:
```html
<script type="module" src="app.js"></script>
```

### Issue: "Failed to fetch dynamically imported module"
**Solution:** Files must be served via HTTP, not file:// protocol

### Issue: Web3Modal not found
**Solution:** Check CDN scripts loaded before app.js:
```html
<script src="https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.js"></script>
```

### Issue: Polling not working
**Solution:** Check wallet is connected:
```javascript
// Polling only starts when wallet connected
walletManager.isConnected() // Should be true
```

## 📚 Additional Resources

- [Web3Modal Docs](https://github.com/Web3Modal/web3modal)
- [Web3.js Docs](https://web3js.readthedocs.io/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## ✅ Checklist for Custom Deployment

- [ ] Update contract bytecode if using modified RPS.sol
- [ ] Configure supported networks in constants.js
- [ ] Update GitHub link in index.html
- [ ] Test on all target networks
- [ ] Verify polling interval is appropriate
- [ ] Check timeout duration matches contract
- [ ] Test wallet connection on target deployment
- [ ] Ensure CORS headers if on custom domain

---

**Version:** 2.0  
**Last Updated:** October 2025

