/**
 * myUtility.js
 * -----------------------
 * Utility class for logging messages with timestamp.
 * Provides:
 *   - getTimeStamp(): returns current time in HH:MM
 *   - log(message): logs message prefixed with timestamp (if debug)
 *   - info(message): always logs timestamp + ": " + message
 * Uses arrow functions in constructor for binding.
 * 
 * Author: Edoardo Sabatini
 * Date: 21 September 2025
 */

class MyUtility {
    constructor() {
        // ----------------------
        // Internal debug flag, default false
        this.isDebug = false;

        // ----------------------
        // Get current timestamp in HH:MM format
        this.getTimeStamp = () => {
            const now = new Date();
            return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        };

        // ----------------------
        // Normal log: prints only if debug is true
        this.log = message => {
            if (this.isDebug) {
                console.log(this.getTimeStamp() + ' -> ' + message);
            }
        };

        // ----------------------
        // Info log: always prints timestamp + ":" + message
        this.info = message => {
            console.log(this.getTimeStamp() + ': ' + message);
        };
    }
}

// CommonJS export
module.exports = MyUtility;
