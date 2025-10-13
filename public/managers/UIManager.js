// UI Manager - Handles all UI updates and user interactions
import { MOVE_NAMES, MOVE_ICONS, GAME_STATES } from '../utils/constants.js';
import { shortenAddress, isValidEthereumAddress, validateStakeAmount, isTimeoutElapsed, getTimeRemaining, formatTimeRemaining } from '../utils/validation.js';

export class UIManager {
    constructor(walletManager, gameManager, contractManager) {
        this.walletManager = walletManager;
        this.gameManager = gameManager;
        this.contractManager = contractManager;
        this.currentTab = 'create';
        this.currentGamesTab = 'active';
        this.currentRevealGameId = null;
        this.timeoutTimers = {};
    }

    /**
     * Initialize UI
     */
    init() {
        this.setupEventListeners();
        this.updateWalletUI();
        this.updateGamesList();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Wallet buttons
        document.getElementById('connect-wallet')?.addEventListener('click', () => this.handleConnectWallet());
        document.getElementById('disconnect-wallet')?.addEventListener('click', () => this.handleDisconnectWallet());
        document.getElementById('clear-memory')?.addEventListener('click', () => this.handleClearMemory());

        // Tab switching
        document.getElementById('create-game-tab')?.addEventListener('click', () => this.switchTab('create'));
        document.getElementById('join-game-tab')?.addEventListener('click', () => this.switchTab('join'));
        document.getElementById('my-games-tab')?.addEventListener('click', () => this.switchTab('games'));

        // Games tabs
        document.getElementById('active-games-tab')?.addEventListener('click', () => this.switchGamesTab('active'));
        document.getElementById('completed-games-tab')?.addEventListener('click', () => this.switchGamesTab('completed'));
        document.getElementById('all-games-tab')?.addEventListener('click', () => this.switchGamesTab('all'));

        // Refresh button
        document.getElementById('refresh-games')?.addEventListener('click', () => this.handleRefreshGames());

        // Create game form
        document.getElementById('create-game-form')?.addEventListener('submit', (e) => this.handleCreateGame(e));

        // Opponent address validation
        document.getElementById('opponent-address')?.addEventListener('input', (e) => this.validateOpponentAddress(e));

        // Move selection
        document.querySelectorAll('#create-game-panel .move-option').forEach(option => {
            option.addEventListener('click', () => this.selectMove(option, 'create'));
        });

        // Join game
        document.getElementById('load-game')?.addEventListener('click', () => this.handleLoadGame());
        document.getElementById('join-game-btn')?.addEventListener('click', () => this.handleJoinGame());

        document.querySelectorAll('#join-game-panel .move-option').forEach(option => {
            option.addEventListener('click', () => this.selectMove(option, 'join'));
        });

        // Reveal modal
        document.getElementById('reveal-move-btn')?.addEventListener('click', () => this.handleRevealMove());
        document.getElementById('close-reveal-modal')?.addEventListener('click', () => this.closeRevealModal());

        const modal = document.getElementById('reveal-modal');
        modal?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeRevealModal();
            }
        });
    }

    /**
     * Validate opponent address in real-time
     */
    validateOpponentAddress(e) {
        const address = e.target.value.trim();
        const submitBtn = document.querySelector('#create-game-form button[type="submit"]');
        const moveSelected = document.getElementById('selected-move')?.value;

        if (!address) {
            submitBtn.disabled = true;
            return;
        }

        if (!isValidEthereumAddress(address)) {
            e.target.style.borderColor = '#ef4444';
            submitBtn.disabled = true;
            return;
        }

        e.target.style.borderColor = '';

        // Enable submit only if address is valid and move is selected
        if (moveSelected) {
            submitBtn.disabled = false;
        }
    }

    /**
     * Handle wallet connection
     */
    async handleConnectWallet() {
        try {
            await this.walletManager.connect();
            this.showMessage('Wallet connected successfully!', 'success');
            this.updateWalletUI();

            // Start polling for game updates
            this.gameManager.startPolling();
        } catch (error) {
            this.showMessage(`Failed to connect wallet: ${error.message}`, 'error');
        }
    }

    /**
     * Handle wallet disconnection
     */
    async handleDisconnectWallet() {
        await this.walletManager.disconnect();
        this.showMessage('Wallet disconnected', 'info');
        this.updateWalletUI();

        // Stop polling
        this.gameManager.stopPolling();
    }

    /**
     * Update wallet UI
     */
    async updateWalletUI() {
        const connectedEl = document.getElementById('wallet-connected');
        const disconnectedEl = document.getElementById('wallet-disconnected');

        if (this.walletManager.isConnected()) {
            disconnectedEl?.classList.add('hidden');
            connectedEl?.classList.remove('hidden');

            const account = this.walletManager.getAccount();
            const balance = await this.walletManager.getBalance();
            const networkName = this.walletManager.getNetworkName();

            document.getElementById('user-address').textContent = shortenAddress(account);
            document.getElementById('user-balance').textContent = parseFloat(balance).toFixed(4);
            document.getElementById('network-name').textContent = networkName;
        } else {
            connectedEl?.classList.add('hidden');
            disconnectedEl?.classList.remove('hidden');
        }
    }

    /**
     * Handle create game
     */
    async handleCreateGame(e) {
        e.preventDefault();

        if (!this.walletManager.isConnected()) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        const opponentAddress = document.getElementById('opponent-address').value.trim();
        const stakeAmount = document.getElementById('stake-amount').value;
        const selectedMove = document.getElementById('selected-move').value;

        // Validate opponent address
        if (!isValidEthereumAddress(opponentAddress)) {
            this.showMessage('Invalid opponent address', 'error');
            return;
        }

        // Validate stake
        const stakeValidation = validateStakeAmount(stakeAmount);
        if (!stakeValidation.valid) {
            this.showMessage(stakeValidation.message, 'error');
            return;
        }

        if (stakeValidation.warning) {
            this.showMessage(stakeValidation.warning, 'warning');
        }

        // Check self-play
        if (opponentAddress.toLowerCase() === this.walletManager.getAccount().toLowerCase()) {
            this.showMessage('You cannot play against yourself', 'error');
            return;
        }

        if (!selectedMove) {
            this.showMessage('Please select a move', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        try {
            await this.gameManager.createGame(opponentAddress, stakeAmount, selectedMove);
            this.showMessage('🎮 Game created successfully!', 'success');

            // Reset form
            e.target.reset();
            document.getElementById('selected-move').value = '';
            document.querySelectorAll('#create-game-panel .move-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // Switch to games tab
            this.switchTab('games');
        } catch (error) {
            this.showMessage(`Failed to create game: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    /**
     * Handle load game details
     */
    async handleLoadGame() {
        const gameId = document.getElementById('game-id-input').value.trim();

        if (!gameId) {
            this.showMessage('Please enter a contract address', 'error');
            return;
        }

        if (!isValidEthereumAddress(gameId)) {
            this.showMessage('Invalid contract address', 'error');
            return;
        }

        if (!this.walletManager.isConnected()) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        try {
            const details = await this.contractManager.getGameDetails(gameId);

            // Show details
            document.getElementById('game-player1').textContent = shortenAddress(details.j1);
            document.getElementById('game-stake').textContent = parseFloat(details.stake).toFixed(4);
            document.getElementById('game-status').textContent = details.c2 === 0 ? 'Waiting for Player 2' : 'Player 2 has joined';
            document.getElementById('game-details')?.classList.remove('hidden');

            this.showMessage('Game details loaded successfully', 'success');
        } catch (error) {
            this.showMessage(`Failed to load game: ${error.message}`, 'error');
        }
    }

    /**
     * Handle join game
     */
    async handleJoinGame() {
        const gameId = document.getElementById('game-id-input').value.trim();
        const selectedMove = document.getElementById('join-selected-move').value;

        if (!selectedMove) {
            this.showMessage('Please select a move', 'error');
            return;
        }

        if (!this.walletManager.isConnected()) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        const joinBtn = document.getElementById('join-game-btn');
        this.setButtonLoading(joinBtn, true);

        try {
            await this.gameManager.joinGame(gameId, selectedMove);
            this.showMessage('Successfully joined the game!', 'success');

            // Reset form
            document.getElementById('game-id-input').value = '';
            document.getElementById('join-selected-move').value = '';
            document.getElementById('game-details')?.classList.add('hidden');
            document.querySelectorAll('#join-game-panel .move-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            this.switchTab('games');
        } catch (error) {
            this.showMessage(`Failed to join game: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(joinBtn, false);
        }
    }

    /**
     * Open reveal modal
     */
    openRevealModal(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            this.showMessage('Game data not found', 'error');
            return;
        }

        if (!game.salt) {
            this.showMessage('Salt data missing. Cannot reveal move.', 'error');
            return;
        }

        const saltEl = document.getElementById('reveal-salt');
        const moveEl = document.getElementById('reveal-move');
        const moveSelectContainer = moveEl?.parentElement;
        const modal = document.getElementById('reveal-modal');

        // Auto-fill salt
        if (saltEl) saltEl.value = game.salt;

        // If move is known from localStorage, disable the selector and show the move
        if (game.move !== undefined) {
            if (moveEl) {
                moveEl.value = game.move;
                moveEl.disabled = true;
            }
            if (moveSelectContainer) {
                const hint = document.createElement('p');
                hint.className = 'move-hint';
                hint.style.cssText = 'font-size: 12px; color: #737373; margin-top: 4px;';
                hint.textContent = `Your move: ${MOVE_NAMES[game.move]} ${MOVE_ICONS[game.move]}`;

                // Remove existing hint if any
                moveSelectContainer.querySelector('.move-hint')?.remove();
                moveSelectContainer.appendChild(hint);
            }
        } else {
            if (moveEl) moveEl.disabled = false;
            moveSelectContainer?.querySelector('.move-hint')?.remove();
        }

        modal?.classList.remove('hidden');
        this.currentRevealGameId = gameId;
    }

    /**
     * Close reveal modal
     */
    closeRevealModal() {
        const modal = document.getElementById('reveal-modal');
        modal?.classList.add('hidden');
        this.currentRevealGameId = null;
    }

    /**
     * Handle reveal move
     */
    async handleRevealMove() {
        if (!this.currentRevealGameId) {
            this.showMessage('No game selected', 'error');
            return;
        }

        const moveEl = document.getElementById('reveal-move');
        const saltEl = document.getElementById('reveal-salt');

        const move = moveEl?.value;
        const salt = saltEl?.value;

        if (!move || !salt) {
            this.showMessage('Move and salt are required', 'error');
            return;
        }

        const revealBtn = document.getElementById('reveal-move-btn');
        this.setButtonLoading(revealBtn, true);

        try {
            await this.gameManager.revealMove(this.currentRevealGameId, move, salt);
            this.showMessage('Move revealed successfully!', 'success');
            this.closeRevealModal();

            // Game state will be updated by polling
        } catch (error) {
            this.showMessage(`Failed to reveal move: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(revealBtn, false);
        }
    }

    /**
     * Handle refresh games
     */
    async handleRefreshGames() {
        const refreshBtn = document.getElementById('refresh-games');
        this.setButtonLoading(refreshBtn, true, 'Refreshing...');

        try {
            await this.gameManager.updateGameStates();
            this.updateGamesList();
            this.showMessage('Games refreshed!', 'success');
        } finally {
            this.setButtonLoading(refreshBtn, false, 'Refresh');
        }
    }

    /**
     * Handle clear memory
     */
    handleClearMemory() {
        if (confirm('Are you sure you want to clear all game data? This will remove all locally stored games.')) {
            this.gameManager.clearAllGames();
            this.updateGamesList();
            this.showMessage('Memory cleared successfully!', 'success');
        }
    }

    /**
     * Switch main tab
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tab === 'games' ? 'my-games' : tab + '-game'}-tab`)?.classList.add('active');

        // Show/hide panels
        document.querySelectorAll('.game-panel').forEach(panel => panel.classList.add('hidden'));
        document.getElementById(`${tab === 'games' ? 'my-games' : tab + '-game'}-panel`)?.classList.remove('hidden');

        if (tab === 'games') {
            this.updateGamesList();
        }
    }

    /**
     * Switch games tab
     */
    switchGamesTab(tab) {
        this.currentGamesTab = tab;

        // Update tab buttons
        document.querySelectorAll('.games-tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tab}-games-tab`)?.classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.games-section').forEach(section => section.classList.add('hidden'));
        document.getElementById(`${tab}-games-list`)?.classList.remove('hidden');

        this.updateGamesList();
    }

    /**
     * Select move
     */
    selectMove(option, context) {
        const container = option.parentNode;
        container.querySelectorAll('.move-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        const move = option.dataset.move;
        const hiddenInput = context === 'create' ?
            document.getElementById('selected-move') :
            document.getElementById('join-selected-move');

        if (hiddenInput) hiddenInput.value = move;

        // Enable submit button only if all validations pass
        const submitBtn = context === 'create' ?
            document.querySelector('#create-game-form button[type="submit"]') :
            document.getElementById('join-game-btn');

        if (context === 'create') {
            const opponentAddress = document.getElementById('opponent-address')?.value.trim();
            if (submitBtn && isValidEthereumAddress(opponentAddress)) {
                submitBtn.disabled = false;
            }
        } else {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    /**
     * Update games list
     */
    updateGamesList() {
        const allGames = this.gameManager.getAllGames();
        const activeGames = this.gameManager.getActiveGames();
        const completedGames = this.gameManager.getCompletedGames();

        // Clear existing timers
        Object.values(this.timeoutTimers).forEach(timer => clearInterval(timer));
        this.timeoutTimers = {};

        // Update containers
        this.updateGamesContainer('active-games-container', activeGames, 'No active games found.');
        this.updateGamesContainer('completed-games-container', completedGames, 'No completed games found.');
        this.updateGamesContainer('all-games-container', allGames, 'No games found. Create or join a game to get started.');

        // Update tab labels
        document.getElementById('active-games-tab').textContent = `Active Games (${activeGames.length})`;
        document.getElementById('completed-games-tab').textContent = `Completed (${completedGames.length})`;
        document.getElementById('all-games-tab').textContent = `All Games (${allGames.length})`;
    }

    /**
     * Update games container
     */
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

    /**
     * Render game item
     */
    renderGameItem(game) {
        const userAccount = this.walletManager.getAccount();
        const isPlayer1 = game.player1.toLowerCase() === userAccount?.toLowerCase();
        const opponent = isPlayer1 ? game.player2 : game.player1;
        const role = isPlayer1 ? 'Creator' : 'Joiner';

        let statusClass = 'status--info';
        let statusText = game.state.replace(/_/g, ' ');
        let actions = '';

        // Determine if timeout is available
        const timeoutAvailable = game.lastAction ? isTimeoutElapsed(game.lastAction) : false;

        if (game.state === GAME_STATES.WAITING_FOR_PLAYER2 && isPlayer1) {
            statusClass = 'status--warning';
            statusText = 'Waiting for opponent';

            const timeoutBtnId = `timeout-btn-${game.id}`;
            const timeoutDisabled = !timeoutAvailable;
            actions = `<button class="btn btn--secondary btn--sm" id="${timeoutBtnId}" 
                        onclick="window.rpsUI.claimTimeout('${game.id}', 'j2')" 
                        ${timeoutDisabled ? 'disabled' : ''}>
                        <span class="btn-text">Claim Timeout</span>
                        ${game.lastAction ? `<span class="timeout-timer" data-game-id="${game.id}" data-last-action="${game.lastAction}"></span>` : ''}
                    </button>`;

            if (game.lastAction && !timeoutAvailable) {
                this.startTimeoutTimer(game.id, game.lastAction, timeoutBtnId);
            }
        } else if (game.state === GAME_STATES.WAITING_FOR_REVEAL && isPlayer1) {
            statusClass = 'status--warning';
            statusText = 'Ready to reveal';
            actions = `<button class="btn btn--primary btn--sm" onclick="window.rpsUI.openRevealModal('${game.id}')">Reveal Move</button>`;
        } else if (game.state === GAME_STATES.WAITING_FOR_REVEAL && !isPlayer1) {
            statusClass = 'status--warning';
            statusText = 'Waiting for reveal';

            const timeoutBtnId = `timeout-btn-${game.id}`;
            const timeoutDisabled = !timeoutAvailable;
            actions = `<button class="btn btn--secondary btn--sm" id="${timeoutBtnId}" 
                        onclick="window.rpsUI.claimTimeout('${game.id}', 'j1')" 
                        ${timeoutDisabled ? 'disabled' : ''}>
                        <span class="btn-text">Claim Timeout</span>
                        ${game.lastAction ? `<span class="timeout-timer" data-game-id="${game.id}" data-last-action="${game.lastAction}"></span>` : ''}
                    </button>`;

            if (game.lastAction && !timeoutAvailable) {
                this.startTimeoutTimer(game.id, game.lastAction, timeoutBtnId);
            }
        } else if (game.state === GAME_STATES.COMPLETED) {
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

        // Show your move
        let myMove = 'Hidden';
        if (isPlayer1 && game.move !== undefined) {
            myMove = MOVE_NAMES[game.move];
        } else if (!isPlayer1 && game.myMove !== undefined) {
            myMove = MOVE_NAMES[game.myMove];
        }

        return `
            <div class="game-item">
                <div class="game-item-header">
                    <h4 class="game-item-title">Game #${shortenAddress(game.id)}</h4>
                    <span class="game-item-status status ${statusClass}">${statusText}</span>
                </div>
                <div class="game-item-details">
                    <div class="game-item-detail">
                        <strong>Role:</strong> ${role}
                    </div>
                    <div class="game-item-detail">
                        <strong>Opponent:</strong> <span class="address-short">${shortenAddress(opponent)}</span>
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
                    <button class="btn btn--outline btn--sm" onclick="window.rpsUI.viewGameDetails('${game.id}')">View Details</button>
                </div>
            </div>
        `;
    }

    /**
     * Start timeout countdown timer
     */
    startTimeoutTimer(gameId, lastAction, btnId) {
        const timer = setInterval(() => {
            const remaining = getTimeRemaining(lastAction);
            const timerEl = document.querySelector(`[data-game-id="${gameId}"].timeout-timer`);
            const btn = document.getElementById(btnId);

            if (remaining > 0) {
                if (timerEl) {
                    timerEl.textContent = ` (${formatTimeRemaining(remaining)})`;
                }
            } else {
                if (timerEl) {
                    timerEl.textContent = ' (Available now)';
                }
                if (btn) {
                    btn.disabled = false;
                }
                clearInterval(timer);
                delete this.timeoutTimers[gameId];
            }
        }, 1000);

        this.timeoutTimers[gameId] = timer;
    }

    /**
     * Claim timeout (called from HTML onclick)
     */
    async claimTimeout(gameId, timeoutType) {
        if (!this.walletManager.isConnected()) {
            this.showMessage('Please connect your wallet first', 'error');
            return;
        }

        const btn = document.getElementById(`timeout-btn-${gameId}`);
        this.setButtonLoading(btn, true);

        try {
            await this.gameManager.claimTimeout(gameId, timeoutType);
            this.showMessage('⏰ Timeout claimed! You won because opponent didn\'t respond in time.', 'success');
        } catch (error) {
            if (error.message.includes('Timeout time has not passed') || error.message.includes('revert')) {
                this.showMessage('⏰ Timeout period has not passed yet. Please wait.', 'warning');
            } else {
                this.showMessage(`Failed to claim timeout: ${error.message}`, 'error');
            }
        } finally {
            this.setButtonLoading(btn, false);
        }
    }

    /**
     * View game details
     */
    viewGameDetails(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) return;

        const details = {
            'Game ID': gameId,
            'Player 1': shortenAddress(game.player1),
            'Player 2': shortenAddress(game.player2),
            'Stake': `${game.stake} ETH`,
            'State': game.state.replace(/_/g, ' '),
            'Created': game.createdAt ? new Date(game.createdAt).toLocaleString() : 'Unknown',
            'Transaction': game.txHash ? `${game.txHash.slice(0, 10)}...` : 'N/A'
        };

        const detailsText = Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

        alert(`Game Details:\n\n${detailsText}\n\nView on Etherscan:\nhttps://etherscan.io/address/${gameId}`);
    }

    /**
     * Show message toast
     */
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

    /**
     * Set button loading state
     */
    setButtonLoading(button, loading, text = null) {
        if (!button) return;

        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (text) button.textContent = text;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (text) button.textContent = text;
        }
    }
}

