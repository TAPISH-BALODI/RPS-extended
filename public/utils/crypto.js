// Cryptographic Utility Functions

/**
 * Generates a secure random salt using Web Crypto API
 * @returns {string} - Hex string with 0x prefix
 */
export function generateSecureRandom() {
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    return '0x' + Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
}

/**
 * Creates a commitment hash for a move and salt
 * @param {Object} web3 - Web3 instance
 * @param {number} move - The move (contract enum value)
 * @param {string} salt - The salt value
 * @returns {string} - Keccak256 hash
 */
export function createCommitment(web3, move, salt) {
    if (!web3) return null;
    const packed = web3.utils.encodePacked(
        { type: 'uint8', value: move },
        { type: 'uint256', value: salt }
    );
    return web3.utils.keccak256(packed);
}

/**
 * Determines if move1 wins against move2 based on contract logic
 * @param {number} move1 - First move
 * @param {number} move2 - Second move
 * @returns {boolean} - True if move1 wins
 */
export function doesMoveWin(move1, move2) {
    // Contract logic: if same parity, lower wins; if different parity, higher wins
    if (move1 === move2) return false; // Tie
    if (move1 % 2 === move2 % 2) {
        return move1 < move2; // Same parity, lower wins
    } else {
        return move1 > move2; // Different parity, higher wins
    }
}

