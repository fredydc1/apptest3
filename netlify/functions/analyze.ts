import { GoogleGenAI } from "@google/genai";
import type { Context } from '@netlify/functions';

// The shape of the entire application's data, received from the frontend.
interface AppData {
    cashFlowSessions: any[];
    employees: any[];
    supplierExpenses: any[];
    structuralCosts: any[];
}

export default async (request: Request, context: Context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*', // Restrict this in production
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
        headers['Allow'] = 'POST, OPTIONS';
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }

    // IMPORTANT: Get the API key from Netlify's environment variables.
    // This keeps the key secure and out of the frontend code.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable not set.");
        return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key.' }), { status: 500, headers });
    }

    try {
        const data: AppData = await request.json();

        // Sanitize data to avoid sending huge base64 image strings to the model
        const sanitizedData = {
            ...data,
            supplierExpenses: data.supplierExpenses.map(({ imageUrl, ...rest }) => rest),
        };

        const prompt = `
Actúa como un analista financiero experto. A continuación se presentan los datos financieros de un negocio, probablemente un bar o discoteca, en formato JSON.
Tu tarea es analizar estos datos y proporcionar un informe claro y conciso en formato Markdown.

El informe debe incluir:
1.  **Resumen Ejecutivo:** Una visión general de la salud financiera del negocio (ingresos, gastos, beneficio neto).
2.  **Puntos Clave:** Observaciones importantes, como las principales fuentes de ingresos, las categorías de gastos más significativas y cualquier tendencia notable.
3.  **Recomendaciones:** De 2 a 3 sugerencias prácticas y accionables para mejorar la rentabilidad, optimizar costes o aumentar ingresos.

Utiliza un tono profesional pero accesible. Estructura la respuesta con títulos y listas para que sea fácil de leer.

Aquí están los datos:
${JSON.stringify(sanitizedData, null, 2)}
`;

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        const analysisText = response.text;
        
        return new Response(JSON.stringify({ analysis: analysisText }), { headers });

    } catch (error) {
        console.error("Error during AI analysis:", error);
        return new Response(JSON.stringify({ error: 'Failed to get analysis from AI service.' }), { status: 500, headers });
    }
};
