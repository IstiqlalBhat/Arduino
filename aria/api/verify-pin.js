// Vercel Serverless Function - PIN Verification
// The SYSTEM_PIN is stored as an environment variable in Vercel dashboard

module.exports = function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pin } = req.body;

        if (!pin) {
            return res.status(400).json({ 
                success: false, 
                error: 'PIN required' 
            });
        }

        // Get PIN from environment variable (set in Vercel dashboard)
        const systemPin = process.env.SYSTEM_PIN;

        if (!systemPin) {
            console.error('SYSTEM_PIN environment variable not configured');
            return res.status(500).json({ 
                success: false, 
                error: 'System configuration error' 
            });
        }

        // Constant-time comparison to prevent timing attacks
        const isValid = pin.length === systemPin.length && 
                        timingSafeEqual(pin, systemPin);

        if (isValid) {
            // Generate a simple session token
            const sessionToken = generateSessionToken();
            
            return res.status(200).json({ 
                success: true,
                token: sessionToken
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid PIN' 
            });
        }
    } catch (error) {
        console.error('PIN verification error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Verification failed' 
        });
    }
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// Generate a random session token
function generateSessionToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
