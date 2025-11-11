import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const analyzeFinancialData = async (data: AppData): Promise<string> => {
    // Sanitize data to avoid sending huge image strings
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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("La llamada a la API de IA ha fallado.");
    }
};
