// Wallet Manager - Handles wallet connection using Web3Modal
import { CHAIN_IDS, NETWORK_NAMES } from '../utils/constants.js';
import { shortenAddress } from '../utils/validation.js';

export class WalletManager {
    constructor() {
        this.web3Modal = null;
        this.provider = null;
        this.web3 = null;
        this.userAccount = null;
        this.chainId = null;
        this.onAccountChangeCallbacks = [];
        this.onChainChangeCallbacks = [];
        this.onConnectCallbacks = [];
        this.onDisconnectCallbacks = [];
    }

    /**
     * Initialize Web3Modal
     */
    async init() {
        const providerOptions = {
            // Add specific provider options here if needed in future
            // For now, we'll use MetaMask which is auto-detected
        };

        this.web3Modal = new Web3Modal.default({
            cacheProvider: true,
            providerOptions,
            disableInjectedProvider: false,
        });

        // Check if previously connected
        if (this.web3Modal.cachedProvider) {
            await this.connect();
        }
    }

    /**
     * Connect wallet
     */
    async connect() {
        try {
            this.provider = await this.web3Modal.connect();
            this.web3 = new Web3(this.provider);

            const accounts = await this.web3.eth.getAccounts();
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.userAccount = accounts[0];
            this.chainId = await this.web3.eth.getChainId();

            // Setup event listeners
            this.setupEventListeners();

            // Trigger connect callbacks
            this.onConnectCallbacks.forEach(cb => cb(this.userAccount, this.chainId));

            return {
                account: this.userAccount,
                chainId: this.chainId
            };
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        if (this.web3Modal) {
            await this.web3Modal.clearCachedProvider();
        }

        if (this.provider?.disconnect) {
            await this.provider.disconnect();
        }

        this.provider = null;
        this.web3 = null;
        this.userAccount = null;
        this.chainId = null;

        // Trigger disconnect callbacks
        this.onDisconnectCallbacks.forEach(cb => cb());
    }

    /**
     * Setup provider event listeners
     */
    setupEventListeners() {
        if (!this.provider) return;

        // Account changed
        this.provider.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                await this.disconnect();
            } else {
                this.userAccount = accounts[0];
                this.onAccountChangeCallbacks.forEach(cb => cb(this.userAccount));
            }
        });

        // Chain changed
        this.provider.on('chainChanged', async (chainId) => {
            this.chainId = parseInt(chainId, 16);
            this.onChainChangeCallbacks.forEach(cb => cb(this.chainId));
        });

        // Disconnect
        this.provider.on('disconnect', async () => {
            await this.disconnect();
        });
    }

    /**
     * Register callback for account changes
     */
    onAccountChange(callback) {
        this.onAccountChangeCallbacks.push(callback);
    }

    /**
     * Register callback for chain changes
     */
    onChainChange(callback) {
        this.onChainChangeCallbacks.push(callback);
    }

    /**
     * Register callback for connection
     */
    onConnect(callback) {
        this.onConnectCallbacks.push(callback);
    }

    /**
     * Register callback for disconnection
     */
    onDisconnect(callback) {
        this.onDisconnectCallbacks.push(callback);
    }

    /**
     * Get current account
     */
    getAccount() {
        return this.userAccount;
    }

    /**
     * Get current chain ID
     */
    getChainId() {
        return this.chainId;
    }

    /**
     * Get network name
     */
    getNetworkName() {
        if (!this.chainId) return 'Not Connected';

        const chainIdHex = '0x' + this.chainId.toString(16);
        return NETWORK_NAMES[chainIdHex] || `Unknown Network (${this.chainId})`;
    }

    /**
     * Get wallet balance
     */
    async getBalance() {
        if (!this.web3 || !this.userAccount) {
            return '0';
        }

        try {
            const balance = await this.web3.eth.getBalance(this.userAccount);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Failed to get balance:', error);
            return '0';
        }
    }

    /**
     * Check if wallet is connected
     */
    isConnected() {
        return this.web3 !== null && this.userAccount !== null;
    }

    /**
     * Get Web3 instance
     */
    getWeb3() {
        return this.web3;
    }

    /**
     * Get provider
     */
    getProvider() {
        return this.provider;
    }
}

