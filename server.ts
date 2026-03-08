import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Images Scraper Proxy Route
  app.get("/api/search-images", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
      // Add a random delay to avoid triggering rate limits
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

      // Use a browser-like User-Agent to get the standard results page
      const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(q as string)}&tbm=isch`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://www.google.com/"
        }
      });

      const html = response.data;
      const matches: { url: string; title: string; source?: string }[] = [];
      
      // Look for the JSON data in the script tags
      // Google often embeds image data in structures like ["http...", height, width]
      const imgDataRegex = /\["(https?:\/\/[^"]+)",(\d+),(\d+)\]/g;
      let match;
      
      while ((match = imgDataRegex.exec(html)) !== null) {
        const url = match[1];
        const height = parseInt(match[2]);
        const width = parseInt(match[3]);

        // Filter out small icons, tracking pixels, and non-image extensions
        if (url.includes("gstatic.com") || url.includes("google.com") || url.includes("favicon")) continue;
        if (height < 100 || width < 100) continue; // Skip very small images
        
        // Avoid duplicates
        if (!matches.some(m => m.url === url)) {
          matches.push({
            url: url,
            title: `Image for ${q} (${width}x${height})`,
          });
        }
        
        if (matches.length >= 30) break;
      }

      // Fallback: search for standard img tags if the JSON extraction fails
      if (matches.length < 5) {
        const imgTagRegex = /<img[^>]+src="([^">]+)"[^>]*alt="([^">]*)"/g;
        while ((match = imgTagRegex.exec(html)) !== null) {
          const url = match[1];
          const alt = match[2] || `Image for ${q}`;
          
          if (url.startsWith("http") && !url.includes("google.com") && !url.includes("gstatic.com")) {
            if (!matches.some(m => m.url === url)) {
              matches.push({ url, title: alt });
            }
          }
          if (matches.length >= 30) break;
        }
      }

      res.json(matches);
    } catch (error: any) {
      console.error("Scraping Error:", error.message);
      if (error.response?.status === 429) {
        res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
      } else {
        res.status(500).json({ error: "Failed to scrape images" });
      }
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
