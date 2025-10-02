# Development Guide

## Project Structure

```
RPS-extended/
├── contracts/
│   └── RPS.sol              # Original smart contract
├── public/
│   ├── index.html           # Main web interface
│   ├── app.js              # Web3 application logic
│   └── style.css           # Styling
├── README.md               # Project documentation
└── DEVELOPMENT.md          # This file
```

## Quick Start

1. **Open the application**
   ```bash
   # Option 1: Direct file access
   open public/index.html
   
   # Option 2: Local server
   cd public
   python -m http.server 3000
   # Then open http://localhost:3000
   ```

2. **Connect MetaMask**
   - Install MetaMask browser extension
   - Connect to any Ethereum network
   - Ensure you have ETH for gas fees

## How It Works

### Smart Contract Integration

The application uses the original RPS.sol contract which:

- **Creates individual contracts** for each game
- **Uses constructor** to initialize with commitment and opponent
- **Implements commit-reveal** scheme for fair play
- **Handles payouts** automatically

### Frontend Architecture

- **Vanilla JavaScript**: No frameworks, maximum compatibility
- **Web3.js**: Direct blockchain interaction
- **Local Storage**: Game data persistence
- **MetaMask Integration**: Wallet connection and transactions

### Game Flow

1. **Create Game**: Deploy new RPS contract with commitment
2. **Join Game**: Use contract address to call `play()` function
3. **Reveal Move**: Use contract address to call `solve()` function
4. **Automatic Payout**: Smart contract handles fund distribution

## Development Features

### No Build Process Required

- **Direct HTML/CSS/JS**: No compilation needed
- **Web3.js CDN**: Loaded from CDN
- **Local Storage**: No database required
- **Static Files**: Can be served from any web server

### Smart Contract Methods

The app interacts with these contract functions:

```solidity
// Constructor - creates new game
RPS(bytes32 _c1Hash, address _j2) payable

// Player 2 joins and makes move
function play(Move _c2) payable

// Player 1 reveals move and determines winner
function solve(Move _c1, uint256 _salt)

// Timeout functions
function j1Timeout()
function j2Timeout()
```

### Frontend Functions

Key JavaScript functions:

- `createGame()`: Deploy new RPS contract
- `joinGame()`: Call `play()` on existing contract
- `revealMove()`: Call `solve()` on existing contract
- `loadGameDetails()`: Read contract state

## Testing

### Local Testing

1. **Use testnet**: Sepolia, Goerli, etc.
2. **Get test ETH**: From faucets
3. **Test with friends**: Share contract addresses
4. **Check transactions**: On block explorers

### Production Testing

1. **Small stakes**: Start with minimal amounts
2. **Test all scenarios**: Win, lose, tie, timeout
3. **Verify payouts**: Check fund distribution
4. **Network conditions**: Test under different loads

## Deployment

### Static Hosting
- **Vercel**: Fast global CDN

### Requirements

- **HTTPS**: Required for MetaMask
- **Web3 Provider**: MetaMask or similar
- **Ethereum Network**: Any compatible network

## Security Considerations

### Smart Contract

- **Original Contract**: Uses proven RPS.sol contract
- **No Modifications**: Contract is unchanged
- **Audited Logic**: Well-tested game mechanics
- **Timeout Protection**: Prevents stuck games

### Frontend

- **No Private Keys**: MetaMask handles all signing
- **Local Storage**: Only stores game metadata
- **No Server**: No backend to compromise
- **Open Source**: All code is visible

## Troubleshooting

### Common Issues

1. **MetaMask Not Connected**
   - Check if MetaMask is installed
   - Ensure it's unlocked
   - Try refreshing the page

2. **Transaction Fails**
   - Check gas fees
   - Verify network connection
   - Ensure sufficient ETH balance

3. **Game Not Found**
   - Verify contract address
   - Check if contract exists
   - Ensure correct network

4. **Move Reveal Fails**
   - Check salt value
   - Verify move selection
   - Ensure you're the game creator

### Debug Mode

Open browser console (F12) to see:
- Transaction details
- Contract interactions
- Error messages
- Game state information

## Contributing

### Code Style

- **Vanilla JavaScript**: No frameworks
- **ES6+ Features**: Modern JavaScript
- **Clear Comments**: Explain complex logic
- **Error Handling**: Graceful failure handling

### Testing

- **Manual Testing**: Test all game flows
- **Network Testing**: Test on different networks
- **Browser Testing**: Test in different browsers
- **Mobile Testing**: Test on mobile devices

## Future Enhancements

### Possible Improvements

- **Game History**: Track past games
- **Statistics**: Win/loss records
- **Tournaments**: Multi-player competitions
- **Mobile App**: Native mobile version

### Limitations

- **Gas Costs**: Each game requires gas fees
- **Network Dependency**: Requires stable internet
- **MetaMask Required**: Browser extension needed
- **Single Game**: One game per contract

---

**Happy Developing! 🚀**