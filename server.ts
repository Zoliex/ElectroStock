import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const defaultSettings = {
  directusUrl: process.env.VITE_DIRECTUS_URL || "https://directus.example.com",
  criticalStockThreshold: 10,
  enableAiSuggestions: true
};

async function startServer() {
  const app = express();

  // Set trust proxy to true to support reverse proxies like Tailscale HTTPS/Funnel
  // This is required for correctly handling X-Forwarded-Proto, X-Forwarded-For, etc.
  app.set('trust proxy', true);

  const PORT = process.env.PORT || 3000;

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  // Proxy /directus requests to the Directus instance
  app.use(
    '/directus',
    createProxyMiddleware({
      target: defaultSettings.directusUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/directus': '', // remove /directus prefix
      },
      on: {
        proxyReq: (proxyReq, req, res) => {
          console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        proxyRes: (proxyRes, req, res) => {
          console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url}`);
        },
        error: (err, req, res) => {
          console.error(`[Proxy Error] ${req.method} ${req.url}`, err);
        }
      }
    })
  );

  // Apply JSON body parsing ONLY to /api routes so it doesn't interfere with the proxy
  app.use("/api", express.json());

  // Settings API
  app.get("/api/settings", (req, res) => {
    console.log("[API] GET /api/settings");
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        res.json({ ...defaultSettings, ...JSON.parse(data) });
      } else {
        res.json(defaultSettings);
      }
    } catch (error) {
      console.error("[API] Error reading settings:", error);
      res.status(500).json({ error: "Failed to read settings" });
    }
  });

  app.post("/api/settings", (req, res) => {
    console.log("[API] POST /api/settings", req.body);
    try {
      const currentSettings = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) : defaultSettings;
      const newSettings = { ...currentSettings, ...req.body };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
      res.json({ success: true, settings: newSettings });
    } catch (error) {
      console.error("[API] Error saving settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.post("/api/restart", (req, res) => {
    console.log("[API] POST /api/restart");
    res.json({ success: true, message: "Stopping application..." });
    // Stop the process after a short delay to allow the response to be sent
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });

  // SerpApi Image Search Proxy Route
  app.get("/api/search-images", async (req, res) => {
    const { q } = req.query;
    console.log(`[API] GET /api/search-images?q=${q}`);

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    if (!process.env.SERPAPI_API_KEY) {
      console.error("[API] SerpApi key not configured");
      return res.status(500).json({ error: "SerpApi key not configured" });
    }

    try {
      const response = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google_images",
          q: q,
          api_key: process.env.SERPAPI_API_KEY
        }
      });

      if (!response.data.error) {
        const matches = response.data.images_results.map((result: any) => ({
          url: result.original,
          title: result.title
        }));
        return res.json(matches);
      }
      return res.json([]);
    } catch (error: any) {
      console.error("[API] SerpApi failed", error.message);
      res.status(500).json({ error: "Failed to fetch images." });
    }
  });

  // AI Research Route
  app.post("/api/ai-research", async (req, res) => {
    const { name, context, categoriesInfo, packagesInfo, apiKey } = req.body;
    console.log(`[API] POST /api/ai-research for component: ${name}`);

    if (!name) {
      return res.status(400).json({ error: "Component name is required" });
    }

    const keyToUse = apiKey || process.env.GEMINI_API_KEY;
    if (!keyToUse) {
      console.error("[API] Gemini API key not configured");
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: keyToUse });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Research the electronic component named "${name}".
        Here is some context from search results: ${context || ''}
       
        CRITICAL INSTRUCTION FOR CATEGORIES, SUBCATEGORIES AND PACKAGES:
        You MUST choose from the following existing categories and packages if they are even remotely similar. DO NOT suggest new ones unless absolutely no existing option fits.
        Available categories and their subcategories: ${categoriesInfo || 'none'}.
        Available packages: ${packagesInfo || 'none'}.
       
        Provide a detailed technical description for an inventory system in Markdown format.
        IMPORTANT FORMATTING RULES:
        - Use proper markdown formatting with double newlines (\\n\\n) between paragraphs.
        - Use bullet points for lists.
        - DO NOT output the description as a single long line.
        Include:
        - Component description
        - Pinout information
        - Key characteristics/specifications
       
        Return the data in JSON format matching the schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING", description: "A detailed technical description in Markdown format, including pinout, characteristics, etc. MUST use proper line breaks." },
              category: { type: "STRING", description: "The best-matching category from the available list or a suggested new one" },
              subcategory: { type: "STRING", description: "The best-matching subcategory from the chosen category's subcategories, or a suggested new one" },
              package: { type: "STRING", description: "The best-matching package from the available list or a suggested new one" },
              keywords: { type: "ARRAY", items: { type: "STRING" }, description: "Relevant technical keywords" },
              packet_reference: { type: "STRING", description: "A likely manufacturer part number or reference" }
            },
            required: ["description", "category", "subcategory", "package", "keywords"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");

      // Fix potential double-escaped newlines from Gemini
      if (data.description) {
        data.description = data.description.replace(/\\n/g, '\n');
      }

      res.json(data);
    } catch (error: any) {
      console.error("[API] AI Research failed", error);
      res.status(500).json({ error: "Failed to research component." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access locally at http://localhost:${PORT}`);
  });
}

startServer();