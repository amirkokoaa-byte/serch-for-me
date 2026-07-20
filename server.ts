import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { searchAll } from "./src/scrapers/ScraperEngine";
import { aggregateResults } from "./src/middleware/Aggregator";
import { cacheManager } from "./src/utils/CacheManager";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const rawResults = await cacheManager.getOrFetch(query, () => searchAll(query));
      const aggregated = aggregateResults(query, rawResults);
      res.json({ result: aggregated });
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({ error: "An error occurred while searching", details: error.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
