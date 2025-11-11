import { AppData } from '../types';

// Endpoints for Netlify Functions
const DATA_API_ENDPOINT = '/.netlify/functions/data';
const AI_API_ENDPOINT = '/.netlify/functions/analyze';
const AUTH_API_ENDPOINT = '/.netlify/functions/auth';

/**
 * --- AUTHENTICATION ---
 */

/**
 * Attempts to log in by sending a password to the auth function.
 * @param password The password to check.
 * @returns A promise that resolves to true if login is successful, false otherwise.
 */
export const login = async (password: string): Promise<boolean> => {
    try {
        const response = await fetch(AUTH_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        if (response.ok) {
            const result = await response.json();
            return result.success === true;
        }
        return false;
    } catch (error) {
        console.error("Login request failed:", error);
        return false;
    }
};


// --- NETLIFY FUNCTIONS + NEON DB SERVICE ---
// This service communicates with Netlify Functions which in turn connect to the database.
// This is the production-ready, secure way to handle data persistence and AI calls.

/**
 * The default empty state for the application.
 */
const getDefaultData = (): AppData => ({
    cashFlowSessions: [],
    employees: [],
    supplierExpenses: [],
    structuralCosts: []
});

/**
 * --- DATA PERSISTENCE ---
 */

/**
 * Fetches all application data from the backend function.
 * @returns A promise that resolves to the full application data.
 */
export const getAllData = async (): Promise<AppData> => {
    try {
        const response = await fetch(DATA_API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch data from API:", error);
        alert("Error: No se pudieron cargar los datos desde la base de datos. Se usará un estado inicial vacío.");
        return getDefaultData();
    }
};

/**
 * Saves the entire application data object via the backend function.
 * @param data The complete application data state.
 */
export const saveData = async (data: AppData): Promise<void> => {
    try {
        const response = await fetch(DATA_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Failed to save data via API:", error);
        throw error;
    }
};

/**
 * --- AI ANALYSIS ---
 */

/**
 * Sends financial data to a secure backend function for analysis with Gemini.
 * @param data The application data to be analyzed.
 * @returns A promise that resolves to a markdown string with the analysis.
 */
export const analyzeFinancialData = async (data: AppData): Promise<string> => {
    try {
        const response = await fetch(AI_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `AI Analysis API Error: ${response.statusText}`);
        }
        const result = await response.json();
        return result.analysis;
    } catch (error) {
        console.error("Failed to get AI analysis:", error);
        throw error;
    }
};