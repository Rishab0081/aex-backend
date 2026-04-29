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
   ✅ CORS (CLEAN & CORRECT)
========================= */


const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / server calls

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.options("*", cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

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
   ✅ ERROR HANDLER (LAST)
========================= */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
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
      console.log("Socket connected:", socket.id);
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup error:", error.message);
    process.exit(1);
  }
};

startServer();