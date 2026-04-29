import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import { setSocketIO } from "./utils/socket.js";

dotenv.config();

const app = express();

/* =========================
   ✅ CORS CONFIG (FIXED)
========================= */

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 🔥 CRITICAL: handle preflight properly
app.options("*", cors());

/* =========================
   ✅ MIDDLEWARE
========================= */

app.use(express.json());

/* =========================
   ✅ ROUTES
========================= */

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", authRoutes);
app.use("/teams", teamRoutes);
app.use("/matches", matchRoutes);
app.use("/leaderboard", leaderboardRoutes);

/* =========================
   ✅ ERROR HANDLER
========================= */

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =========================
   ✅ SERVER START
========================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");

    const server = http.createServer(app);

    const io = new SocketServer(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    setSocketIO(io);

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();