import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const DIRECTUS_TOKEN = 'FHSqhqx84zCUm3eM-UHpqjISY2bCSDcY';
const DIRECTUS_URL = 'http://coqs.freeboxos.fr:16400';

const directus = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const searchInventoryFunction: FunctionDeclaration = {
      name: "searchInventory",
      description: "Search the electronic components inventory by name, category, or description.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: "The search query (e.g., 'resistor', '10k', 'arduino')."
          }
        },
        required: ["query"]
      }
    };

    console.log("Fetching items...");
    const items = await directus.request(readItems('components', {
      search: 'tp4056',
      limit: 5,
      fields: ['name', 'quantity_available', 'description', 'type.name'] as any
    }));

    const functionResponse = {
      name: "searchInventory",
      response: { items }
    };

    console.log("Calling Gemini...");
    const secondResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        { role: "user", parts: [{ text: "Do we have tp4056?" }] },
        { role: "model", parts: [{ functionCall: { name: "searchInventory", args: { query: "tp4056" } } }] },
        { role: "user", parts: [{ functionResponse }] }
      ],
      config: {
        tools: [{ functionDeclarations: [searchInventoryFunction] }]
      }
    });
    
    console.log("Success:", secondResponse.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
