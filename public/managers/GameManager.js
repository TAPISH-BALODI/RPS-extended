// Game Manager - Manages game state and data persistence
import { GAME_STATES, POLLING_INTERVAL } from '../utils/constants.js';
import { generateSecureRandom } from '../utils/crypto.js';
import { doesMoveWin } from '../utils/crypto.js';

export class GameManager {
    constructor(contractManager, walletManager) {
        this.contractManager = contractManager;
        this.walletManager = walletManager;
        this.gameData = this.loadGameData();
        this.pollingInterval = null;
        this.onGameUpdateCallbacks = [];
    }

    /**
     * Load game data from localStorage
     */
    loadGameData() {
        try {
            const data = localStorage.getItem('rps_game_data');
            return data ? JSON.parse(data) : { games: [] };
        } catch (error) {
            console.error('Error loading game data:', error);
            return { games: [] };
        }
    }

    /**
     * Save game data to localStorage
     */
    saveGameData() {
        try {
            localStorage.setItem('rps_game_data', JSON.stringify(this.gameData));
        } catch (error) {
            console.error('Error saving game data:', error);
        }
    }

    /**
     * Create a new game
     */
    async createGame(opponentAddress, stakeAmount, move) {
        const salt = generateSecureRandom();
        const userAccount = this.walletManager.getAccount();

        // Deploy contract
        const { address, txHash } = await this.contractManager.deployGame(
            opponentAddress,
            stakeAmount,
            move,
            salt
        );

        // Save game data locally
        const gameData = {
            id: address,
            player1: userAccount,
            player2: opponentAddress,
            stake: stakeAmount,
            move: parseInt(move),
            salt: salt,
            state: GAME_STATES.WAITING_FOR_PLAYER2,
            txHash: txHash,
            createdAt: new Date().toISOString()
        };

        this.gameData.games.push(gameData);
        this.saveGameData();
        this.triggerUpdate();

        return gameData;
    }

    /**
     * Join an existing game
     */
    async joinGame(gameAddress, move) {
        const userAccount = this.walletManager.getAccount();

        // Get game details first
        const details = await this.contractManager.getGameDetails(gameAddress);

        // Join the game
        const { txHash } = await this.contractManager.joinGame(gameAddress, move);

        // Save game data locally
        const gameData = {
            id: gameAddress,
            player1: details.j1,
            player2: userAccount,
            stake: details.stake,
            myMove: parseInt(move),
            state: GAME_STATES.WAITING_FOR_REVEAL,
            txHash: txHash,
            joinedAt: new Date().toISOString()
        };

        this.gameData.games.push(gameData);
        this.saveGameData();
        this.triggerUpdate();

        return gameData;
    }

    /**
     * Reveal move
     */
    async revealMove(gameId, move, salt) {
        const { txHash } = await this.contractManager.revealMove(gameId, move, salt);

        // Update local game state
        const game = this.gameData.games.find(g => g.id === gameId);
        if (game) {
            game.revealTxHash = txHash;
            game.revealedAt = new Date().toISOString();
            // State will be updated by polling
            this.saveGameData();
            this.triggerUpdate();
        }

        return txHash;
    }

    /**
     * Claim timeout
     */
    async claimTimeout(gameId, timeoutType) {
        const { txHash } = await this.contractManager.claimTimeout(gameId, timeoutType);

        // Update local game state
        const game = this.gameData.games.find(g => g.id === gameId);
        if (game) {
            game.state = GAME_STATES.COMPLETED;
            game.winner = '⏰ Timeout - You won!';
            game.timeoutTxHash = txHash;
            this.saveGameData();
            this.triggerUpdate();
        }

        return txHash;
    }

    /**
     * Get all games
     */
    getAllGames() {
        return this.gameData.games;
    }

    /**
     * Get active games
     */
    getActiveGames() {
        return this.gameData.games.filter(game =>
            game.state === GAME_STATES.WAITING_FOR_PLAYER2 ||
            game.state === GAME_STATES.WAITING_FOR_REVEAL ||
            game.state === GAME_STATES.REVEALED
        );
    }

    /**
     * Get completed games
     */
    getCompletedGames() {
        return this.gameData.games.filter(game =>
            game.state === GAME_STATES.COMPLETED
        );
    }

    /**
     * Get game by ID
     */
    getGame(gameId) {
        return this.gameData.games.find(g => g.id === gameId);
    }

    /**
     * Clear all game data
     */
    clearAllGames() {
        this.gameData = { games: [] };
        localStorage.removeItem('rps_game_data');
        this.triggerUpdate();
    }

    /**
     * Start polling for game updates
     */
    startPolling() {
        if (this.pollingInterval) {
            return; // Already polling
        }

        this.pollingInterval = setInterval(async () => {
            await this.updateGameStates();
        }, POLLING_INTERVAL);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Update all game states from blockchain
     */
    async updateGameStates() {
        if (!this.walletManager.isConnected()) {
            return;
        }

        let hasUpdates = false;

        for (const game of this.gameData.games) {
            // Only check active games
            if (game.state === GAME_STATES.COMPLETED) {
                continue;
            }

            try {
                const details = await this.contractManager.getGameDetails(game.id);

                // Check if game is completed (stake is 0)
                if (details.stakeWei === '0') {
                    if (game.state !== GAME_STATES.COMPLETED) {
                        game.state = GAME_STATES.COMPLETED;

                        // Determine winner if we have the move data
                        if (game.move !== undefined && details.c2 > 0) {
                            const userMove = game.move;
                            const opponentMove = details.c2;

                            if (userMove === opponentMove) {
                                game.winner = 'Tie! Funds split equally';
                            } else if (doesMoveWin(userMove, opponentMove)) {
                                game.winner = '🎉 You won!';
                            } else {
                                game.winner = '😔 You lost';
                            }
                        } else if (game.myMove !== undefined && details.c2 > 0) {
                            // For player 2
                            game.winner = 'Game completed';
                        } else {
                            game.winner = 'Game completed';
                        }

                        hasUpdates = true;
                    }
                }
                // Check if player 2 has joined
                else if (details.c2 > 0 && game.state === GAME_STATES.WAITING_FOR_PLAYER2) {
                    game.state = GAME_STATES.WAITING_FOR_REVEAL;
                    hasUpdates = true;
                }

                // Store lastAction for timeout calculations
                game.lastAction = details.lastAction;

            } catch (error) {
                console.log('Could not update game state for:', game.id);
            }
        }

        if (hasUpdates) {
            this.saveGameData();
            this.triggerUpdate();
        }
    }

    /**
     * Register callback for game updates
     */
    onGameUpdate(callback) {
        this.onGameUpdateCallbacks.push(callback);
    }

    /**
     * Trigger update callbacks
     */
    triggerUpdate() {
        this.onGameUpdateCallbacks.forEach(cb => cb());
    }
}

