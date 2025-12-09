
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "../types";

// Clave API proporcionada para el entorno de demostración.
const DEMO_API_KEY = "AIzaSyCVkoRDKgPGUN-oVPtqHuJdvH9MoexGGQ0";

// Recuperar clave de forma segura para Vite/Navegador
// NOTA: En Netlify, la variable debe llamarse 'VITE_API_KEY' para ser visible aquí.
// @ts-ignore
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    }
  } catch (e) {
    console.warn("Entorno no soporta import.meta.env");
  }
  return null;
};

const apiKey = getApiKey() || DEMO_API_KEY;

const ai = new GoogleGenAI({ apiKey });

export const generateInventoryResponse = async (
  query: string,
  inventoryContext: InventoryItem[]
): Promise<string> => {
  
  // Create a lightweight context string from the inventory
  const contextString = inventoryContext.map(item =>
    `- ${item.name} (${item.category}): Total ${item.quantity}, Disponible ${item.available}. ID: ${item.id}. Specs: ${JSON.stringify(item.specifications)}`
  ).join('\n');

  const systemPrompt = `
    Eres el Asistente Inteligente de Defensa Civil Yerba Buena.
    Tu misión es ayudar al personal a localizar equipos y gestionar el inventario.
    
    INVENTARIO ACTUAL:
    ${contextString}
    
    INSTRUCCIONES:
    1. Responde preguntas sobre disponibilidad basándote SOLO en el inventario actual provisto arriba.
    2. Si te piden sugerencias para un nuevo equipo (que no está en la lista), sugiere especificaciones técnicas estándar para emergencias.
    3. Sé conciso, profesional y usa un tono de servicio de emergencia.
    4. Si preguntan por algo que no existe, dilo claramente.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "No pude generar una respuesta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al consultar a la IA. Verifique su conexión o clave API.";
  }
};
