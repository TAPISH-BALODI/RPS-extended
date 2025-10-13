// Main Application Entry Point
import { WalletManager } from './managers/WalletManager.js';
import { ContractManager } from './managers/ContractManager.js';
import { GameManager } from './managers/GameManager.js';
import { UIManager } from './managers/UIManager.js';

class RPSGame {
    constructor() {
        this.walletManager = new WalletManager();
        this.contractManager = new ContractManager(this.walletManager);
        this.gameManager = new GameManager(this.contractManager, this.walletManager);
        this.uiManager = new UIManager(this.walletManager, this.gameManager, this.contractManager);
    }

    async init() {
        try {
            // Initialize Web3Modal
            await this.walletManager.init();

            // Initialize UI
            this.uiManager.init();

            // Setup wallet event callbacks
            this.walletManager.onAccountChange((account) => {
                this.uiManager.updateWalletUI();
                this.uiManager.showMessage('Account changed', 'info');
            });

            this.walletManager.onChainChange((chainId) => {
                this.uiManager.updateWalletUI();
                this.uiManager.showMessage('Network changed. Page will reload...', 'info');
                setTimeout(() => window.location.reload(), 2000);
            });

            this.walletManager.onConnect((account, chainId) => {
                this.uiManager.updateWalletUI();
                this.gameManager.startPolling();
            });

            this.walletManager.onDisconnect(() => {
                this.uiManager.updateWalletUI();
                this.gameManager.stopPolling();
            });

            // Setup game update callbacks
            this.gameManager.onGameUpdate(() => {
                this.uiManager.updateGamesList();
            });

            // If wallet is already connected, start polling
            if (this.walletManager.isConnected()) {
                this.gameManager.startPolling();
            }

        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const rpsGame = new RPSGame();
    await rpsGame.init();

    // Expose UIManager globally for onclick handlers in dynamically generated HTML
    window.rpsUI = rpsGame.uiManager;
});
