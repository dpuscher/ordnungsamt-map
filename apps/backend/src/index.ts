import express from "express";
import cors from "cors";
import compression from "compression";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import meldungenRouter from "./routes/meldungen.js";
import statsRouter from "./routes/stats.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "4000", 10);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET"],
  }),
);

app.use(compression());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/health", (_request, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/meldungen", meldungenRouter);
app.use("/api/stats", statsRouter);

// 404 handler
app.use((_request, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

app.listen(port, error => {
  if (error) {
    throw error;
  }

  console.log(`[backend] Listening on port ${port}`);
});
