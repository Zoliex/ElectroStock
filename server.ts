import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      // Try SerpApi first
      if (process.env.SERPAPI_API_KEY) {
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
        } catch (serpError: any) {
          console.error("SerpApi failed, trying Unsplash:", serpError.message);
        }
      }

      // Fallback to Unsplash
      if (process.env.UNSPLASH_ACCESS_KEY) {
        const response = await axios.get("https://api.unsplash.com/search/photos", {
          params: {
            query: q,
            per_page: 10,
            client_id: process.env.UNSPLASH_ACCESS_KEY
          }
        });

        const matches = response.data.results.map((result: any) => ({
          url: result.urls.regular,
          title: result.alt_description || "Unsplash Image"
        }));
        return res.json(matches);
      }

      throw new Error("No image search provider configured");
    } catch (error: any) {
      console.error("Image Search Error:", error.message);
      res.status(500).json({ error: "Failed to fetch images. Please check your API key configuration." });
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
