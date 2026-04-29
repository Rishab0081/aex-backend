import { Router } from "express";
import { getLeaderboard } from "../controllers/teamController.js";

const router = Router();

router.get("/", getLeaderboard);

export default router;