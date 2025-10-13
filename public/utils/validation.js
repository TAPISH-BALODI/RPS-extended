// Validation Helper Functions

/**
 * Validates if a string is a valid Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid Ethereum address
 */
export function isValidEthereumAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    // Check if it starts with 0x and has 42 characters (0x + 40 hex chars)
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return false;
    }
    return true;
}

/**
 * Validates stake amount
 * @param {string|number} stake - The stake amount to validate
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateStakeAmount(stake) {
    const stakeNum = parseFloat(stake);

    if (isNaN(stakeNum)) {
        return { valid: false, message: 'Please enter a valid stake amount' };
    }

    if (stakeNum <= 0) {
        return { valid: false, message: 'Stake amount must be greater than 0' };
    }

    // Remove the artificial limit, just warn for very high amounts
    if (stakeNum > 10) {
        return {
            valid: true,
            warning: 'High stake amount detected. Please ensure you have sufficient funds for both stake and gas fees.'
        };
    }

    return { valid: true };
}

/**
 * Shortens an Ethereum address for display
 * @param {string} address - Full Ethereum address
 * @returns {string} - Shortened address (0x1234...5678)
 */
export function shortenAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Checks if timeout period has elapsed
 * @param {number} lastActionTimestamp - Unix timestamp of last action (in seconds)
 * @param {number} timeoutDuration - Timeout duration in milliseconds
 * @returns {boolean} - True if timeout period has elapsed
 */
export function isTimeoutElapsed(lastActionTimestamp, timeoutDuration = 5 * 60 * 1000) {
    const lastActionMs = lastActionTimestamp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    return (currentTime - lastActionMs) >= timeoutDuration;
}

/**
 * Gets time remaining until timeout
 * @param {number} lastActionTimestamp - Unix timestamp of last action (in seconds)
 * @param {number} timeoutDuration - Timeout duration in milliseconds
 * @returns {number} - Milliseconds remaining (0 if timeout has elapsed)
 */
export function getTimeRemaining(lastActionTimestamp, timeoutDuration = 5 * 60 * 1000) {
    const lastActionMs = lastActionTimestamp * 1000;
    const currentTime = Date.now();
    const elapsed = currentTime - lastActionMs;
    const remaining = timeoutDuration - elapsed;
    return Math.max(0, remaining);
}

/**
 * Formats milliseconds into a readable time string
 * @param {number} ms - Milliseconds
 * @returns {string} - Formatted time string (e.g., "4:30")
 */
export function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Timeout available';

    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

