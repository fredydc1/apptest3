import { neon } from '@netlify/neon';
import type { Context } from '@netlify/functions';

// The shape of the entire application's data.
interface AppData {
    cashFlowSessions: any[];
    employees: any[];
    supplierExpenses: any[];
    structuralCosts: any[];
}

// Default empty state for the application
const getDefaultData = (): AppData => ({
    cashFlowSessions: [],
    employees: [],
    supplierExpenses: [],
    structuralCosts: []
});

// Main function handler
export default async (request: Request, context: Context) => {
    // Set CORS headers for all responses to allow local development
    const headers = {
        'Access-Control-Allow-Origin': '*', // Restrict this to your domain in production
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight CORS requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }
    
    try {
        // Connect to the database. The URL is automatically picked up from 
        // the NETLIFY_DATABASE_URL environment variable.
        const sql = neon(); 
        const DATA_ID = 'main_data_v1'; // A constant ID for our single data blob

        // Create table if it doesn't exist.
        // This is a simple approach for a single-data-blob app.
        await sql`
            CREATE TABLE IF NOT EXISTS app_data (
                id VARCHAR(50) PRIMARY KEY,
                data JSONB
            );
        `;

        if (request.method === 'GET') {
            const result = await sql`SELECT data FROM app_data WHERE id = ${DATA_ID}`;
            
            if (result.length > 0 && result[0].data) {
                // Return the found data
                return new Response(JSON.stringify(result[0].data), { headers });
            } else {
                // No data found in the DB, return the default empty structure
                return new Response(JSON.stringify(getDefaultData()), { headers });
            }
        }

        if (request.method === 'POST') {
            const appData: AppData = await request.json();
            
            // This is an "upsert" operation. It will insert a new row if one with the ID doesn't exist,
            // or it will update the existing row if it does.
            await sql`
                INSERT INTO app_data (id, data) 
                VALUES (${DATA_ID}, ${JSON.stringify(appData)}) 
                ON CONFLICT (id) 
                DO UPDATE SET data = EXCLUDED.data;
            `;
            
            return new Response(JSON.stringify({ message: 'Data saved successfully' }), { headers });
        }
        
        headers['Allow'] = 'GET, POST, OPTIONS';
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });

    } catch (error) {
        console.error('Database operation failed:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers });
    }
};
