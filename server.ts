import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const defaultSettings = {
  directusUrl: process.env.VITE_DIRECTUS_URL || "https://directus.example.com",
  criticalStockThreshold: 10,
  currency: "USD",
  enableAiSuggestions: true
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Settings API
  app.get("/api/settings", (req, res) => {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        res.json({ ...defaultSettings, ...JSON.parse(data) });
      } else {
        res.json(defaultSettings);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to read settings" });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const currentSettings = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) : defaultSettings;
      const newSettings = { ...currentSettings, ...req.body };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
      res.json({ success: true, settings: newSettings });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // SerpApi Image Search Proxy Route
  app.get("/api/search-images", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    if (!process.env.SERPAPI_API_KEY) {
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
      console.error("SerpApi failed", error.message);
      res.status(500).json({ error: "Failed to fetch images." });
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
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
