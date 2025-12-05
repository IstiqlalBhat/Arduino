const FIREBASE_URL = 'aria-58e32-default-rtdb.firebaseio.com';

/**
 * Checks if the Firebase DB is reachable.
 * @returns {Promise<boolean>}
 */
export async function checkConnection() {
    try {
        const response = await fetch(`https://${FIREBASE_URL}/.json`);
        return response.ok;
    } catch (error) {
        console.error('Firebase connection check failed:', error);
        return false;
    }
}

/**
 * Sends a message to the Firebase DB.
 * @param {string} text - Message content
 * @param {string} sessionToken - Session token for auth/logging
 * @param {string} pin - Access PIN for Arduino verification
 * @returns {Promise<any>}
 */
export async function sendMessage(text, sessionToken, pin) {
    const message = {
        text: text,
        timestamp: Date.now(),
        processed: false,
        sessionToken: sessionToken,
        pin: pin  // Arduino checks this field
    };

    const response = await fetch(`https://${FIREBASE_URL}/messages.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    });

    if (!response.ok) {
        throw new Error('Failed to send message packet to uplink.');
    }

    return await response.json();
}
