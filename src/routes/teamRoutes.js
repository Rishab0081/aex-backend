import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createTeam, deleteTeam, getTeams, updateTeam } from "../controllers/teamController.js";

const router = Router();

router.get("/", getTeams);
router.post("/", authMiddleware, createTeam);
router.put("/:id", authMiddleware, updateTeam);
router.delete("/:id", authMiddleware, deleteTeam);

export default router;