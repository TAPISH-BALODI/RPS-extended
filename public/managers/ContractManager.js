// Contract Manager - Handles smart contract interactions
import { CONTRACT_ABI, CONTRACT_BYTECODE, MOVE_MAPPING } from '../utils/constants.js';
import { createCommitment, generateSecureRandom } from '../utils/crypto.js';

export class ContractManager {
    constructor(walletManager) {
        this.walletManager = walletManager;
    }

    /**
     * Deploy a new RPS contract
     */
    async deployGame(opponentAddress, stakeAmount, move, salt) {
        const web3 = this.walletManager.getWeb3();
        const userAccount = this.walletManager.getAccount();

        if (!web3 || !userAccount) {
            throw new Error('Wallet not connected');
        }

        try {
            // Create commitment
            const contractMove = MOVE_MAPPING[parseInt(move)];
            const commitment = createCommitment(web3, contractMove, salt);

            // Deploy contract
            const RPSContract = new web3.eth.Contract(CONTRACT_ABI);
            const deployedContract = await RPSContract.deploy({
                data: CONTRACT_BYTECODE,
                arguments: [commitment, opponentAddress]
            }).send({
                from: userAccount,
                value: web3.utils.toWei(stakeAmount, 'ether'),
                gas: 3000000
            });

            return {
                address: deployedContract.options.address,
                txHash: deployedContract.transactionHash
            };
        } catch (error) {
            console.error('Failed to deploy contract:', error);
            throw error;
        }
    }

    /**
     * Join an existing game
     */
    async joinGame(gameAddress, move) {
        const web3 = this.walletManager.getWeb3();
        const userAccount = this.walletManager.getAccount();

        if (!web3 || !userAccount) {
            throw new Error('Wallet not connected');
        }

        try {
            const gameContract = new web3.eth.Contract(CONTRACT_ABI, gameAddress);

            // Get stake amount
            const stake = await gameContract.methods.stake().call();
            const stakeAmount = web3.utils.fromWei(stake, 'ether');

            // Join the game
            const contractMove = MOVE_MAPPING[parseInt(move)];
            const tx = await gameContract.methods.play(contractMove).send({
                from: userAccount,
                value: web3.utils.toWei(stakeAmount, 'ether')
            });

            return {
                txHash: tx.transactionHash
            };
        } catch (error) {
            console.error('Failed to join game:', error);
            throw error;
        }
    }

    /**
     * Reveal move
     */
    async revealMove(gameAddress, move, salt) {
        const web3 = this.walletManager.getWeb3();
        const userAccount = this.walletManager.getAccount();

        if (!web3 || !userAccount) {
            throw new Error('Wallet not connected');
        }

        try {
            const gameContract = new web3.eth.Contract(CONTRACT_ABI, gameAddress);
            const contractMove = MOVE_MAPPING[parseInt(move)];

            const tx = await gameContract.methods.solve(contractMove, salt).send({
                from: userAccount
            });

            return {
                txHash: tx.transactionHash
            };
        } catch (error) {
            console.error('Failed to reveal move:', error);
            throw error;
        }
    }

    /**
     * Claim timeout (j1 or j2)
     */
    async claimTimeout(gameAddress, timeoutType) {
        const web3 = this.walletManager.getWeb3();
        const userAccount = this.walletManager.getAccount();

        if (!web3 || !userAccount) {
            throw new Error('Wallet not connected');
        }

        try {
            const gameContract = new web3.eth.Contract(CONTRACT_ABI, gameAddress);

            let tx;
            if (timeoutType === 'j1') {
                tx = await gameContract.methods.j1Timeout().send({
                    from: userAccount
                });
            } else {
                tx = await gameContract.methods.j2Timeout().send({
                    from: userAccount
                });
            }

            return {
                txHash: tx.transactionHash
            };
        } catch (error) {
            console.error('Failed to claim timeout:', error);
            throw error;
        }
    }

    /**
     * Get game details from contract
     */
    async getGameDetails(gameAddress) {
        const web3 = this.walletManager.getWeb3();

        if (!web3) {
            throw new Error('Wallet not connected');
        }

        try {
            const gameContract = new web3.eth.Contract(CONTRACT_ABI, gameAddress);

            const [j1, j2, stake, c2, c1Hash, lastAction] = await Promise.all([
                gameContract.methods.j1().call(),
                gameContract.methods.j2().call(),
                gameContract.methods.stake().call(),
                gameContract.methods.c2().call(),
                gameContract.methods.c1Hash().call(),
                gameContract.methods.lastAction().call()
            ]);

            return {
                j1,
                j2,
                stake: web3.utils.fromWei(stake, 'ether'),
                c2: parseInt(c2),
                c1Hash,
                lastAction: parseInt(lastAction),
                stakeWei: stake
            };
        } catch (error) {
            console.error('Failed to get game details:', error);
            throw error;
        }
    }

    /**
     * Check if game is completed (stake is 0)
     */
    async isGameCompleted(gameAddress) {
        try {
            const details = await this.getGameDetails(gameAddress);
            return details.stakeWei === '0';
        } catch (error) {
            console.error('Failed to check if game is completed:', error);
            return false;
        }
    }
}

