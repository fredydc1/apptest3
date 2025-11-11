import type { Context } from '@netlify/functions';

export default async (request: Request, context: Context) => {
    // CORS headers to allow requests from the frontend, especially during development
    const headers = {
        'Access-Control-Allow-Origin': '*', // For production, you should restrict this to your app's domain
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        headers['Allow'] = 'POST, OPTIONS';
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }

    // Securely get the application password from environment variables
    const appPassword = process.env.APP_PASSWORD;
    if (!appPassword) {
        console.error("APP_PASSWORD environment variable not set on the server.");
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers });
    }

    try {
        const { password } = await request.json();

        // Check if the provided password matches the one from environment variables
        if (password === appPassword) {
            return new Response(JSON.stringify({ success: true }), { status: 200, headers });
        } else {
            return new Response(JSON.stringify({ success: false, error: 'Incorrect password' }), { status: 401, headers });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400, headers });
    }
};
