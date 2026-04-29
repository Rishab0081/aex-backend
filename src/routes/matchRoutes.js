import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addMatch } from "../controllers/matchController.js";

const router = Router();

router.post("/", authMiddleware, addMatch);

export default router;