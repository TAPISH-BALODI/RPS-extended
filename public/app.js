class RPSGame {
    constructor() {
        this.web3 = null;
        this.userAccount = null;
        this.gameData = this.loadGameData();
        this.contractAddress = '0x0000000000000000000000000000000000000000';
        this.hardhatChainId = '0x7a69';
        this.sepoliaChainId = '0xaa36a7';
        this.currentRevealGameId = null;

        this.gameRules = {
            0: [3, 5],
            1: [1, 4],
            2: [2, 5],
            3: [4, 2],
            4: [3, 1]
        };

        this.moveNames = ['Rock', 'Paper', 'Scissors', 'Lizard', 'Spock'];
        this.moveIcons = ['🪨', '📄', '✂️', '🦎', '🖖'];
        this.moveMapping = [1, 2, 3, 5, 4];

        this.contractABI = [
            {
                "inputs": [
                    {
                        "name": "_c1Hash",
                        "type": "bytes32"
                    },
                    {
                        "name": "_j2",
                        "type": "address"
                    }
                ],
                "payable": true,
                "stateMutability": "payable",
                "type": "constructor"
            },
            {
                "type": "function",
                "name": "j1",
                "inputs": [],
                "outputs": [{ "name": "", "type": "address" }],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "j2",
                "inputs": [],
                "outputs": [{ "name": "", "type": "address" }],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "c1Hash",
                "inputs": [],
                "outputs": [{ "name": "", "type": "bytes32" }],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "c2",
                "inputs": [],
                "outputs": [{ "name": "", "type": "uint8" }],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "stake",
                "inputs": [],
                "outputs": [{ "name": "", "type": "uint256" }],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "lastAction",
                "inputs": [],
                "outputs": [{ "name": "", "type": "uint256" }],
                "stateMutability": "view"
            },
            {
                "type": "function",
                "name": "play",
                "inputs": [{ "name": "_c2", "type": "uint8" }],
                "outputs": [],
                "stateMutability": "payable"
            },
            {
                "type": "function",
                "name": "solve",
                "inputs": [
                    { "name": "_c1", "type": "uint8" },
                    { "name": "_salt", "type": "uint256" }
                ],
                "outputs": [],
                "stateMutability": "nonpayable"
            },
            {
                "type": "function",
                "name": "j1Timeout",
                "inputs": [],
                "outputs": [],
                "stateMutability": "nonpayable"
            },
            {
                "type": "function",
                "name": "j2Timeout",
                "inputs": [],
                "outputs": [],
                "stateMutability": "nonpayable"
            },
            {
                "type": "function",
                "name": "win",
                "inputs": [
                    { "name": "_c1", "type": "uint8" },
                    { "name": "_c2", "type": "uint8" }
                ],
                "outputs": [{ "name": "w", "type": "bool" }],
                "stateMutability": "view"
            }
        ];
    }

    async init() {
        this.setupEventListeners();
        await this.checkWalletConnection();
        this.updateGamesList();

        this.closeRevealModal();


    }



    doesMoveWin(move1, move2) {
        if (move1 === 1 && (move2 === 3 || move2 === 5)) return true;
        if (move1 === 2 && (move2 === 1 || move2 === 4)) return true;
        if (move1 === 3 && (move2 === 2 || move2 === 5)) return true;
        if (move1 === 4 && (move2 === 3 || move2 === 1)) return true;
        if (move1 === 5 && (move2 === 4 || move2 === 2)) return true;
        return false;
    }

    generateSecureRandom() {
        const array = new Uint32Array(8);
        crypto.getRandomValues(array);
        return '0x' + Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
    }

    createCommitment(move, salt) {
        if (!this.web3) return null;
        const packed = this.web3.utils.encodePacked(
            { type: 'uint8', value: move },
            { type: 'uint256', value: salt }
        );
        return this.web3.utils.keccak256(packed);
    }


    shortenAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    loadGameData() {
        try {
            const data = localStorage.getItem('rps_game_data');
            return data ? JSON.parse(data) : { games: [] };
        } catch (error) {
            console.error('Error loading game data:', error);
            return { games: [] };
        }
    }

    saveGameData() {
        try {
            localStorage.setItem('rps_game_data', JSON.stringify(this.gameData));
        } catch (error) {
            console.error('Error saving game data:', error);
        }
    }

    // Status Messages
    showMessage(message, type = 'info', duration = 5000) {
        const container = document.getElementById('status-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `status-message ${type}`;
        messageEl.innerHTML = `
            <span>${message}</span>
            <button class="status-message-close">&times;</button>
        `;

        const closeBtn = messageEl.querySelector('.status-message-close');
        closeBtn.addEventListener('click', () => {
            messageEl.remove();
        });

        container.appendChild(messageEl);

        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, duration);
    }

    setupEventListeners() {
        const connectBtn = document.getElementById('connect-wallet');
        const disconnectBtn = document.getElementById('disconnect-wallet');

        if (connectBtn) connectBtn.addEventListener('click', () => this.connectWallet());
        if (disconnectBtn) disconnectBtn.addEventListener('click', () => this.disconnectWallet());

        const clearMemoryBtn = document.getElementById('clear-memory');
        if (clearMemoryBtn) clearMemoryBtn.addEventListener('click', () => this.clearMemory());

        const refreshGamesBtn = document.getElementById('refresh-games');
        if (refreshGamesBtn) refreshGamesBtn.addEventListener('click', () => this.refreshGames());

        const activeGamesTab = document.getElementById('active-games-tab');
        const completedGamesTab = document.getElementById('completed-games-tab');
        const allGamesTab = document.getElementById('all-games-tab');

        if (activeGamesTab) activeGamesTab.addEventListener('click', () => this.switchGamesTab('active'));
        if (completedGamesTab) completedGamesTab.addEventListener('click', () => this.switchGamesTab('completed'));
        if (allGamesTab) allGamesTab.addEventListener('click', () => this.switchGamesTab('all'));

        const createTab = document.getElementById('create-game-tab');
        const joinTab = document.getElementById('join-game-tab');
        const gamesTab = document.getElementById('my-games-tab');

        if (createTab) createTab.addEventListener('click', () => this.switchTab('create'));
        if (joinTab) joinTab.addEventListener('click', () => this.switchTab('join'));
        if (gamesTab) gamesTab.addEventListener('click', () => this.switchTab('games'));

        const createForm = document.getElementById('create-game-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateGame(e));
        }

        document.querySelectorAll('#create-game-panel .move-option').forEach(option => {
            option.addEventListener('click', () => this.selectMove(option, 'create'));
        });

        const loadGameBtn = document.getElementById('load-game');
        const joinGameBtn = document.getElementById('join-game-btn');

        if (loadGameBtn) loadGameBtn.addEventListener('click', () => this.loadGameDetails());
        if (joinGameBtn) joinGameBtn.addEventListener('click', () => this.joinGame());

        document.querySelectorAll('#join-game-panel .move-option').forEach(option => {
            option.addEventListener('click', () => this.selectMove(option, 'join'));
        });

        const revealBtn = document.getElementById('reveal-move-btn');
        const closeModalBtn = document.getElementById('close-reveal-modal');
        const modal = document.getElementById('reveal-modal');

        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.revealMove());
        }
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeRevealModal());

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeRevealModal();
                }
            });
        }

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.userAccount = accounts[0];
                    this.updateWalletInfo();
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }

    // Tab switching
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const activeTab = document.getElementById(`${tab === 'games' ? 'my-games' : tab + '-game'}-tab`);
        if (activeTab) activeTab.classList.add('active');

        // Show/hide panels
        document.querySelectorAll('.game-panel').forEach(panel => panel.classList.add('hidden'));
        const activePanel = document.getElementById(`${tab === 'games' ? 'my-games' : tab + '-game'}-panel`);
        if (activePanel) activePanel.classList.remove('hidden');

        if (tab === 'games') {
            this.updateGamesList();
        }
    }

    // Move selection
    selectMove(option, context) {
        const container = option.parentNode;
        container.querySelectorAll('.move-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        const move = option.dataset.move;
        const hiddenInput = context === 'create' ?
            document.getElementById('selected-move') :
            document.getElementById('join-selected-move');

        if (hiddenInput) hiddenInput.value = move;

        // Enable submit button
        const submitBtn = context === 'create' ?
            document.querySelector('#create-game-form button[type="submit"]') :
            document.getElementById('join-game-btn');

        if (submitBtn) submitBtn.disabled = false;
    }

    // Wallet Connection
    async connectWallet() {
        try {
            if (!window.ethereum) {
                this.showMessage('MetaMask not detected. Please install MetaMask.', 'error');
                return;
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            if (accounts.length === 0) {
                this.showMessage('No accounts found. Please unlock MetaMask.', 'error');
                return;
            }

            this.userAccount = accounts[0];
            this.web3 = new Web3(window.ethereum);

            // Check network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== this.hardhatChainId && chainId !== this.sepoliaChainId) {
                this.showMessage('Please switch to Hardhat Local or Sepolia network in MetaMask', 'warning');
            }


            this.updateWalletInfo();
            this.showMessage('Wallet connected successfully!', 'success');


        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showMessage(`Failed to connect wallet: ${error.message}`, 'error');
        }
    }


    async checkWalletConnection() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    this.web3 = new Web3(window.ethereum);
                    this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
                    this.updateWalletInfo();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }

    async updateWalletInfo() {
        if (!this.userAccount) return;

        const disconnectedEl = document.getElementById('wallet-disconnected');
        const connectedEl = document.getElementById('wallet-connected');

        if (disconnectedEl) disconnectedEl.classList.add('hidden');
        if (connectedEl) connectedEl.classList.remove('hidden');

        const addressEl = document.getElementById('user-address');
        if (addressEl) addressEl.textContent = this.shortenAddress(this.userAccount);

        try {
            const balance = await this.web3.eth.getBalance(this.userAccount);
            const balanceETH = this.web3.utils.fromWei(balance, 'ether');
            const balanceEl = document.getElementById('user-balance');
            if (balanceEl) balanceEl.textContent = parseFloat(balanceETH).toFixed(4);

            const chainId = await this.web3.eth.getChainId();
            const networkName = chainId === 31337 ? 'Hardhat Local' : 'Unknown Network';
            const networkEl = document.getElementById('network-name');
            if (networkEl) networkEl.textContent = networkName;

        } catch (error) {
            console.error('Error updating wallet info:', error);
        }
    }

    disconnectWallet() {
        this.userAccount = null;
        this.web3 = null;

        const connectedEl = document.getElementById('wallet-connected');
        const disconnectedEl = document.getElementById('wallet-disconnected');

        if (connectedEl) connectedEl.classList.add('hidden');
        if (disconnectedEl) disconnectedEl.classList.remove('hidden');

        this.showMessage('Wallet disconnected', 'info');
    }

    clearMemory() {
        if (confirm('Are you sure you want to clear all game data? This will remove all locally stored games.')) {
            // Clear local storage
            localStorage.removeItem('rps-game-data');

            // Reset game data
            this.gameData = {
                games: []
            };

            // Update UI
            this.updateGamesList();

            this.showMessage('Memory cleared successfully!', 'success');
        }
    }


    async refreshGames() {
        const refreshBtn = document.getElementById('refresh-games');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Refreshing...';
        }

        try {
            // Check blockchain state for active games
            await this.checkBlockchainStates();
            this.updateGamesList();
            this.showMessage('Games refreshed!', 'success');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'Refresh';
            }
        }
    }

    async checkBlockchainStates() {
        if (!this.web3 || !this.userAccount) return;

        for (const game of this.gameData.games) {
            if (game.state === 'waiting_for_player2' || game.state === 'waiting_for_reveal' || game.state === 'revealed') {
                try {
                    const gameContract = new this.web3.eth.Contract(this.contractABI, game.id);
                    const stake = await gameContract.methods.stake().call();
                    const c2 = await gameContract.methods.c2().call();

                    // Check if game state has changed on blockchain
                    if (stake === '0') {
                        // Game is completed
                        game.state = 'completed';
                        game.winner = 'Game completed';
                        this.saveGameData();
                    } else if (parseInt(c2) > 0 && game.state === 'waiting_for_player2') {
                        // Player 2 has joined
                        game.state = 'waiting_for_reveal';
                        this.saveGameData();
                    }
                } catch (error) {
                    console.log('Could not check blockchain state for game:', game.id);
                }
            }
        }
    }

    switchGamesTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.games-tab-button').forEach(btn => btn.classList.remove('active'));

        if (tab === 'active') {
            document.getElementById('active-games-tab').classList.add('active');
        } else if (tab === 'completed') {
            document.getElementById('completed-games-tab').classList.add('active');
        } else if (tab === 'all') {
            document.getElementById('all-games-tab').classList.add('active');
        }

        // Update content sections
        document.querySelectorAll('.games-section').forEach(section => section.classList.add('hidden'));

        if (tab === 'active') {
            document.getElementById('active-games-list').classList.remove('hidden');
        } else if (tab === 'completed') {
            document.getElementById('completed-games-list').classList.remove('hidden');
        } else if (tab === 'all') {
            document.getElementById('all-games-list').classList.remove('hidden');
        }

        // Update the games list for the selected tab
        this.updateGamesList();
    }



    async handleCreateGame(e) {
        e.preventDefault();

        if (!this.userAccount) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        const opponentAddress = document.getElementById('opponent-address').value;
        const stakeAmount = document.getElementById('stake-amount').value;
        const selectedMove = document.getElementById('selected-move').value;

        if (!opponentAddress || !stakeAmount || selectedMove === '') {
            this.showMessage('Please fill all fields and select a move', 'error');
            return;
        }

        // Basic validation for testing purposes
        if (!opponentAddress.startsWith('0x') || opponentAddress.length !== 42) {
            this.showMessage('Invalid opponent address format', 'error');
            return;
        }

        // Safety check for circuit breaker
        if (parseFloat(stakeAmount) > 1) {
            this.showMessage('⚠️ High stake amount detected. Try with a smaller amount (≤ 1 ETH) to avoid circuit breaker issues.', 'warning');
        }

        if (opponentAddress.toLowerCase() === this.userAccount.toLowerCase()) {
            this.showMessage('You cannot play against yourself', 'error');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            }

            // Generate salt and create commitment
            const salt = this.generateSecureRandom();
            const contractMove = this.moveMapping[parseInt(selectedMove)]; // Map to contract enum
            const commitment = this.createCommitment(contractMove, salt);

            // Deploy real RPS contract to blockchain
            console.log('Deploying real RPS contract...');
            console.log('Commitment:', commitment);
            console.log('Opponent:', opponentAddress);
            console.log('Stake:', stakeAmount);

            let gameId;
            let txHash;

            try {
                const RPSContract = new this.web3.eth.Contract(this.contractABI);
                const deployedContract = await RPSContract.deploy({
                    data: '0x6080604081815261012c600555806106aa8339810160405280516020909101513460045560008054600160a060020a0319908116331790915560018054600160a060020a039093169290911691909117905560025542600655610643806100676000396000f3006080604052600436106100b95763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630c4395b981146100be578063294914a4146100f35780633a4b66f11461010a57806348e257cb146101315780634d03e3d21461016a57806353a04b051461017f57806380985af91461018d57806389f71d53146101be578063a5ddec7c146101d3578063c37597c6146101f1578063c839114214610206578063f56f48f21461021b575b600080fd5b3480156100ca57600080fd5b506100df60ff60043581169060243516610230565b604080519115158252519081900360200190f35b3480156100ff57600080fd5b506101086102ec565b005b34801561011657600080fd5b5061011f61034c565b60408051918252519081900360200190f35b34801561013d57600080fd5b50610146610352565b6040518082600581111561015657fe5b60ff16815260200191505060405180910390f35b34801561017657600080fd5b5061011f61035b565b61010860ff60043516610361565b34801561019957600080fd5b506101a26103e1565b60408051600160a060020a039092168252519081900360200190f35b3480156101ca57600080fd5b5061011f6103f0565b3480156101df57600080fd5b5061010860ff600435166024356103f6565b3480156101fd57600080fd5b506101a261059c565b34801561021257600080fd5b506101086105ab565b34801561022757600080fd5b5061011f610611565b600081600581111561023e57fe5b83600581111561024a57fe5b1415610258575060006102e6565b600083600581111561026657fe5b1415610274575060006102e6565b600282600581111561028257fe5b81151561028b57fe5b06600284600581111561029a57fe5b8115156102a357fe5b0614156102ca578160058111156102b657fe5b8360058111156102c257fe5b1090506102e6565b8160058111156102d657fe5b8360058111156102e257fe5b1190505b92915050565b600060035460ff1660058111156102ff57fe5b1461030957600080fd5b60055460065401421161031b57600080fd5b60008054600454604051600160a060020a039092169281156108fc029290818181858888f150506000600455505050565b60045481565b60035460ff1681565b60025481565b600060035460ff16600581111561037457fe5b1461037e57600080fd5b600081600581111561038c57fe5b141561039757600080fd5b60045434146103a557600080fd5b600154600160a060020a031633146103bc57600080fd5b6003805482919060ff191660018360058111156103d557fe5b02179055505042600655565b600154600160a060020a031681565b60065481565b600082600581111561040457fe5b141561040f57600080fd5b600060035460ff16600581111561042257fe5b141561042d57600080fd5b600054600160a060020a0316331461044457600080fd5b600254604051839083908083600581111561045b57fe5b60ff167f0100000000000000000000000000000000000000000000000000000000000000028152600101828152602001925050506040518091039020600019161415156104a757600080fd5b6003546104b890839060ff16610230565b156104f35760008054600454604051600160a060020a0390921692600290910280156108fc02929091818181858888f1935050505050610593565b6003546105039060ff1683610230565b1561053d57600154600454604051600160a060020a0390921691600290910280156108fc02916000818181858888f1935050505050610593565b60008054600454604051600160a060020a039092169281156108fc029290818181858888f15050600154600454604051600160a060020a03909216945080156108fc02935091506000818181858888f150505050505b50506000600455565b600054600160a060020a031681565b600060035460ff1660058111156105be57fe5b14156105c957600080fd5b6005546006540142116105db57600080fd5b600154600454604051600160a060020a0390921691600290910280156108fc02916000818181858888f150506000600455505050565b600554815600a165627a7a723058206319df3e6fee57c2075db92f1f9584befa45c2d7d29d9023570db264dabbfa920029',
                    arguments: [commitment, opponentAddress]
                }).send({
                    from: this.userAccount,
                    value: this.web3.utils.toWei(stakeAmount, 'ether'),
                    gas: 3000000
                });

                gameId = deployedContract.options.address;
                txHash = deployedContract.transactionHash;

                console.log('✅ Real contract deployed successfully!');
                console.log('Contract address:', gameId);
                console.log('Transaction hash:', txHash);

            } catch (deployError) {
                console.error('❌ Contract deployment failed:', deployError);

                // Check for specific blockchain state errors
                if (deployError.message.includes('invalid block tag') || deployError.message.includes('Latest block number is 0')) {
                    this.showMessage('❌ Blockchain not ready. Please:\n\n1. Restart Hardhat node: npx hardhat node --reset\n2. Wait for blockchain to initialize\n3. Try again', 'error');
                } else if (deployError.message.includes('insufficient funds')) {
                    this.showMessage('❌ Insufficient ETH for gas. Please add more ETH to your account.', 'error');
                } else if (deployError.message.includes('circuit breaker')) {
                    this.showMessage('❌ MetaMask circuit breaker is open. Please:\n\n1. Reset MetaMask account (Settings > Advanced > Reset Account)\n2. Or click "Switch to Sepolia" button below\n3. Or wait 10-15 minutes for automatic reset', 'error');
                } else {
                    this.showMessage(`❌ Contract deployment failed: ${deployError.message}\n\nMake sure:\n1. Hardhat node is running (npx hardhat node)\n2. You have enough ETH for gas\n3. You're on the correct network`, 'error');
                }
                return;
            }

            // Save game locally
            const gameData = {
                id: gameId,
                player1: this.userAccount,
                player2: opponentAddress,
                stake: stakeAmount,
                move: parseInt(selectedMove),
                salt: salt,
                commitment: commitment,
                state: 'waiting_for_player2',
                txHash: txHash,
                createdAt: new Date().toISOString()
            };

            this.gameData.games.push(gameData);
            this.saveGameData();

            console.log('Game data saved:', gameData);
            console.log('Total games in local storage:', this.gameData.games.length);

            this.showMessage('🎮 Game created successfully! Real contract deployed to blockchain with ETH stake!', 'success');

            this.updateGamesList();
            this.switchTab('games');

            // Auto-refresh after a short delay
            setTimeout(() => {
                this.refreshGames();
            }, 2000);

            // Reset form
            e.target.reset();
            const selectedMoveEl = document.getElementById('selected-move');
            if (selectedMoveEl) selectedMoveEl.value = '';

            document.querySelectorAll('#create-game-panel .move-option').forEach(opt => {
                opt.classList.remove('selected');
            });

        } catch (error) {
            console.error('Error creating game:', error);
            this.showMessage(`Failed to create game: ${error.message}`, 'error');
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    async loadGameDetails() {
        const gameIdInput = document.getElementById('game-id-input');
        const gameId = gameIdInput.value.trim();

        if (!gameId) {
            this.showMessage('Please enter a contract address', 'error');
            return;
        }

        if (!this.userAccount) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            // Connect to real contract on blockchain
            const gameContract = new this.web3.eth.Contract(this.contractABI, gameId);

            // Get game details
            const j1 = await gameContract.methods.j1().call();
            const j2 = await gameContract.methods.j2().call();
            const stake = await gameContract.methods.stake().call();
            const c2 = await gameContract.methods.c2().call();

            if (!j1 || j1 === '0x0000000000000000000000000000000000000000') {
                this.showMessage('Invalid contract address', 'error');
                return;
            }

            // Show game details
            const player1El = document.getElementById('game-player1');
            const stakeEl = document.getElementById('game-stake');
            const statusEl = document.getElementById('game-status');
            const detailsEl = document.getElementById('game-details');

            const stakeAmount = this.web3.utils.fromWei(stake, 'ether');
            const statusText = c2 === '0' ? 'Waiting for Player 2' : 'Ready to Solve';

            if (player1El) player1El.textContent = this.shortenAddress(j1);
            if (stakeEl) stakeEl.textContent = parseFloat(stakeAmount).toFixed(4) + ' ETH';
            if (statusEl) statusEl.textContent = statusText;
            if (detailsEl) detailsEl.classList.remove('hidden');

            this.showMessage('Game details loaded successfully', 'success');

        } catch (error) {
            console.error('Error loading game details:', error);
            this.showMessage(`Failed to load game: ${error.message}`, 'error');
        }
    }

    async joinGame() {
        const gameId = document.getElementById('game-id-input').value.trim();
        const selectedMove = document.getElementById('join-selected-move').value;

        if (!selectedMove) {
            this.showMessage('Please select a move', 'error');
            return;
        }

        if (!this.userAccount) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            const joinBtn = document.getElementById('join-game-btn');
            if (joinBtn) {
                joinBtn.classList.add('loading');
                joinBtn.disabled = true;
            }

            // Connect to the specific RPS contract
            const gameContract = new this.web3.eth.Contract(this.contractABI, gameId);

            // Get stake amount
            const stake = await gameContract.methods.stake().call();
            const stakeAmount = this.web3.utils.fromWei(stake, 'ether');

            // Join the game using the play function
            const contractMove = this.moveMapping[parseInt(selectedMove)]; // Map to contract enum
            const tx = await gameContract.methods.play(contractMove).send({
                from: this.userAccount,
                value: this.web3.utils.toWei(stakeAmount, 'ether')
            });

            // Save locally
            const gameData = {
                id: gameId,
                player1: await gameContract.methods.j1().call(),
                player2: this.userAccount,
                stake: stakeAmount,
                myMove: parseInt(selectedMove),
                state: 'waiting_for_reveal',
                txHash: tx.transactionHash,
                joinedAt: new Date().toISOString()
            };

            this.gameData.games.push(gameData);
            this.saveGameData();

            this.showMessage('Successfully joined the game!', 'success');

            // Auto-refresh after a short delay
            setTimeout(() => {
                this.refreshGames();
            }, 2000);

            // Reset form
            const joinForm = document.getElementById('join-game-form');
            if (joinForm) joinForm.reset();

            const detailsEl = document.getElementById('game-details');
            if (detailsEl) detailsEl.classList.add('hidden');

            document.querySelectorAll('#join-game-panel .move-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            this.switchTab('games');

        } catch (error) {
            console.error('Error joining game:', error);
            this.showMessage(`Failed to join game: ${error.message}`, 'error');
        } finally {
            const joinBtn = document.getElementById('join-game-btn');
            if (joinBtn) {
                joinBtn.classList.remove('loading');
                joinBtn.disabled = false;
            }
        }
    }

    openRevealModal(gameId) {
        const game = this.gameData.games.find(g => g.id === gameId);
        if (!game) {
            this.showMessage('Game data not found. Please refresh and try again.', 'error');
            return;
        }

        if (!game.salt) {
            this.showMessage('Salt data missing. Cannot reveal move.', 'error');
            return;
        }

        const saltEl = document.getElementById('reveal-salt');
        const moveEl = document.getElementById('reveal-move');
        const modal = document.getElementById('reveal-modal');

        if (saltEl) saltEl.value = game.salt;
        if (moveEl) moveEl.value = game.move;
        if (modal) modal.classList.remove('hidden');

        this.currentRevealGameId = gameId;
    }

    closeRevealModal() {
        const modal = document.getElementById('reveal-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentRevealGameId = null;
    }

    async revealMove() {
        if (!this.currentRevealGameId) {
            this.showMessage('No current reveal game ID', 'error');
            return;
        }

        const moveEl = document.getElementById('reveal-move');
        const saltEl = document.getElementById('reveal-salt');

        const move = moveEl ? moveEl.value : '';
        const salt = saltEl ? saltEl.value : '';

        if (!move || !salt) {
            this.showMessage('Move and salt are required', 'error');
            return;
        }

        try {
            const revealBtn = document.getElementById('reveal-move-btn');
            if (revealBtn) {
                revealBtn.classList.add('loading');
                revealBtn.disabled = true;
            }

            // Connect to the specific RPS contract and reveal
            const gameContract = new this.web3.eth.Contract(this.contractABI, this.currentRevealGameId);
            const contractMove = this.moveMapping[parseInt(move)]; // Map to contract enum
            const tx = await gameContract.methods.solve(contractMove, salt).send({
                from: this.userAccount
            });

            // Check the game outcome from the blockchain
            const stake = await gameContract.methods.stake().call();
            const j1 = await gameContract.methods.j1().call();
            const j2 = await gameContract.methods.j2().call();

            // Determine winner based on stake (if stake is 0, game is over)
            let gameOutcome = 'revealed';
            let winner = null;

            if (stake === '0') {
                // Game is over, determine winner by checking balances or other logic
                gameOutcome = 'completed';

                // Get the actual moves from the contract to determine winner
                const c1Hash = await gameContract.methods.c1Hash().call();
                const c2 = await gameContract.methods.c2().call();

                // Determine winner based on the game rules
                const userMove = this.moveMapping[parseInt(move)]; // User's revealed move
                const opponentMove = parseInt(c2); // Opponent's move from contract

                console.log('Game moves - User:', userMove, 'Opponent:', opponentMove);

                if (userMove === opponentMove) {
                    winner = 'Tie! Funds split equally';
                } else if (this.doesMoveWin(userMove, opponentMove)) {
                    winner = '🎉 You won!';
                } else {
                    winner = '😔 You lost';
                }
            }

            // Show different toast styles based on outcome
            if (winner) {
                if (winner.includes('🎉')) {
                    this.showMessage(`🎉 ${winner}`, 'success');
                } else if (winner.includes('😔')) {
                    this.showMessage(`😔 ${winner}`, 'error');
                } else if (winner.includes('Tie')) {
                    this.showMessage(`🤝 ${winner}`, 'info');
                } else {
                    this.showMessage(`Move revealed successfully! ${winner}`, 'success');
                }
            } else {
                this.showMessage(`Move revealed successfully! Game ${gameOutcome === 'completed' ? 'completed' : 'revealed'}.`, 'success');
            }
            this.closeRevealModal();

            // Update local state
            const game = this.gameData.games.find(g => g.id === this.currentRevealGameId);
            if (game) {
                game.state = gameOutcome;
                game.revealTxHash = tx.transactionHash;
                game.revealedAt = new Date().toISOString();
                if (winner) {
                    game.winner = winner;
                }
                this.saveGameData();
                this.updateGamesList();

                // Auto-refresh after a short delay to ensure blockchain state is updated
                setTimeout(() => {
                    this.refreshGames();
                }, 3000);

                // Also check immediately if the game is completed
                setTimeout(async () => {
                    try {
                        const gameContract = new this.web3.eth.Contract(this.contractABI, this.currentRevealGameId);
                        const stake = await gameContract.methods.stake().call();
                        if (stake === '0') {
                            game.state = 'completed';
                            game.winner = 'Game completed';
                            this.saveGameData();
                            this.updateGamesList();
                        }
                    } catch (error) {
                        console.log('Could not check immediate game completion:', error);
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error revealing move:', error);
            this.showMessage(`Failed to reveal move: ${error.message}`, 'error');
        } finally {
            const revealBtn = document.getElementById('reveal-move-btn');
            if (revealBtn) {
                revealBtn.classList.remove('loading');
                revealBtn.disabled = false;
            }
        }
    }

    updateGamesList() {
        if (this.gameData.games.length === 0) {
            // Show no games message in all containers
            document.getElementById('active-games-container').innerHTML = '<p class="no-games">No active games found.</p>';
            document.getElementById('completed-games-container').innerHTML = '<p class="no-games">No completed games found.</p>';
            document.getElementById('all-games-container').innerHTML = '<p class="no-games">No games found. Create or join a game to get started.</p>';
            return;
        }

        // Filter games by status
        const activeGames = this.gameData.games.filter(game =>
            game.state === 'waiting_for_player2' ||
            game.state === 'waiting_for_reveal' ||
            game.state === 'revealed'
        );

        const completedGames = this.gameData.games.filter(game =>
            game.state === 'completed'
        );

        // Update each container
        this.updateGamesContainer('active-games-container', activeGames, 'No active games found.');
        this.updateGamesContainer('completed-games-container', completedGames, 'No completed games found.');
        this.updateGamesContainer('all-games-container', this.gameData.games, 'No games found. Create or join a game to get started.');

        // Update tab labels with counts
        this.updateTabLabels(activeGames.length, completedGames.length, this.gameData.games.length);
    }

    updateGamesContainer(containerId, games, noGamesMessage) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (games.length === 0) {
            container.innerHTML = `<p class="no-games">${noGamesMessage}</p>`;
            return;
        }

        const gamesHTML = games.map(game => this.renderGameItem(game)).join('');
        container.innerHTML = gamesHTML;
    }

    updateTabLabels(activeCount, completedCount, totalCount) {
        const activeTab = document.getElementById('active-games-tab');
        const completedTab = document.getElementById('completed-games-tab');
        const allTab = document.getElementById('all-games-tab');

        if (activeTab) {
            activeTab.textContent = `Active Games (${activeCount})`;
        }
        if (completedTab) {
            completedTab.textContent = `Completed (${completedCount})`;
        }
        if (allTab) {
            allTab.textContent = `All Games (${totalCount})`;
        }
    }

    renderGameItem(game) {
        const isPlayer1 = game.player1.toLowerCase() === this.userAccount?.toLowerCase();
        const opponent = isPlayer1 ? game.player2 : game.player1;
        const role = isPlayer1 ? 'Creator' : 'Joiner';

        let statusClass = 'status--info';
        let statusText = game.state.replace(/_/g, ' ');
        let actions = '';

        if (game.state === 'waiting_for_player2' && isPlayer1) {
            statusClass = 'status--warning';
            statusText = 'Waiting for opponent';
            actions = `<button class="btn btn--secondary btn--sm" onclick="window.rpsGame.claimTimeout('${game.id}', 'j2')">Claim Timeout</button>`;
        } else if (game.state === 'waiting_for_reveal' && isPlayer1) {
            statusClass = 'status--warning';
            statusText = 'Ready to reveal';
            actions = `<button class="btn btn--primary btn--sm" onclick="window.rpsGame.openRevealModal('${game.id}')">Reveal Move</button>`;
        } else if (game.state === 'waiting_for_reveal' && !isPlayer1) {
            statusClass = 'status--warning';
            statusText = 'Waiting for reveal';
            actions = `<button class="btn btn--secondary btn--sm" onclick="window.rpsGame.claimTimeout('${game.id}', 'j1')">Claim Timeout</button>`;
        } else if (game.state === 'revealed' || game.state === 'completed') {
            statusClass = 'status--success';
            if (game.winner) {
                if (game.winner.includes('🎉')) {
                    statusText = '🏆 You Won!';
                } else if (game.winner.includes('😔')) {
                    statusText = '💔 You Lost';
                } else if (game.winner.includes('Tie')) {
                    statusText = '🤝 Tie Game';
                } else {
                    statusText = game.winner;
                }
            } else {
                statusText = 'Game completed';
            }
        }

        // Show your move, hide opponent's move
        let myMove = 'Hidden';
        if (isPlayer1) {
            // You're player 1, show your move if available
            if (game.move !== undefined) {
                myMove = this.moveNames[game.move];
            }
        } else {
            // You're player 2, show your move if available
            if (game.myMove !== undefined) {
                myMove = this.moveNames[game.myMove];
            }
        }

        return `
            <div class="game-item">
                <div class="game-item-header">
                    <h4 class="game-item-title">Game #${game.id}</h4>
                    <span class="game-item-status status ${statusClass}">${statusText}</span>
                </div>
                <div class="game-item-details">
                    <div class="game-item-detail">
                        <strong>Role:</strong> ${role}
                    </div>
                    <div class="game-item-detail">
                        <strong>Opponent:</strong> <span class="address-short">${this.shortenAddress(opponent)}</span>
                    </div>
                    <div class="game-item-detail">
                        <strong>Stake:</strong> ${game.stake} ETH
                    </div>
                    <div class="game-item-detail">
                        <strong>My Move:</strong> ${myMove}
                    </div>
                </div>
                <div class="game-item-actions">
                    ${actions}
                    <button class="btn btn--outline btn--sm" onclick="window.rpsGame.viewGameDetails('${game.id}')">View Details</button>
                </div>
            </div>
        `;
    }

    viewGameDetails(gameId) {
        const game = this.gameData.games.find(g => g.id === gameId);
        if (!game) return;

        const details = {
            'Game ID': gameId,
            'Player 1': this.shortenAddress(game.player1),
            'Player 2': this.shortenAddress(game.player2),
            'Stake': `${game.stake} ETH`,
            'State': game.state.replace(/_/g, ' '),
            'Created': game.createdAt ? new Date(game.createdAt).toLocaleString() : 'Unknown',
            'Transaction': game.txHash ? `${game.txHash.slice(0, 10)}...` : 'N/A'
        };

        const detailsText = Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        alert(`Game Details:\n\n${detailsText}`);
    }

    determineWinner(move1, move2) {
        if (move1 === move2) return 'tie';
        return this.gameRules[move1].includes(move2) ? 'player1' : 'player2';
    }

    async claimTimeout(gameId, timeoutType) {
        if (!this.userAccount) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            const gameContract = new this.web3.eth.Contract(this.contractABI, gameId);

            let tx;
            if (timeoutType === 'j1') {
                // Player 2 claims timeout because Player 1 didn't reveal
                tx = await gameContract.methods.j1Timeout().send({
                    from: this.userAccount
                });
                this.showMessage('⏰ Timeout claimed! You won because opponent didn\'t reveal in time.', 'success');
            } else if (timeoutType === 'j2') {
                // Player 1 claims timeout because Player 2 didn't join
                tx = await gameContract.methods.j2Timeout().send({
                    from: this.userAccount
                });
                this.showMessage('⏰ Timeout claimed! You won because opponent didn\'t join in time.', 'success');
            }

            // Update local game state
            const game = this.gameData.games.find(g => g.id === gameId);
            if (game) {
                game.state = 'completed';
                game.winner = '⏰ Timeout - You won!';
                game.timeoutTxHash = tx.transactionHash;
                this.saveGameData();
                this.updateGamesList();
            }

        } catch (error) {
            console.error('Error claiming timeout:', error);
            if (error.message.includes('Timeout time has not passed')) {
                this.showMessage('⏰ Timeout period has not passed yet. Please wait.', 'warning');
            } else {
                this.showMessage(`Failed to claim timeout: ${error.message}`, 'error');
            }
        }
    }

}

let rpsGame;

document.addEventListener('DOMContentLoaded', () => {
    rpsGame = new RPSGame();
    rpsGame.init();
    window.rpsGame = rpsGame;

});