import Team from "../models/Team.js";
import { fetchSortedLeaderboard } from "../utils/leaderboard.js";
import { emitLeaderboardUpdated } from "../utils/socket.js";

const normalizeTeamName = (payload) => {
  const raw = payload.teamName ?? payload.name;
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
};

export const getTeams = async (_req, res) => {
  try {
    const teams = await Team.find().sort({ teamName: 1 });
    return res.status(200).json(teams);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch teams", error: error.message });
  }
};

export const getLeaderboard = async (_req, res) => {
  try {
    const leaderboard = await fetchSortedLeaderboard();
    return res.status(200).json(leaderboard);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch leaderboard", error: error.message });
  }
};

export const createTeam = async (req, res) => {
  try {
    const teamName = normalizeTeamName(req.body || {});
    const logo = typeof req.body?.logo === "string" ? req.body.logo.trim() : "";

    if (!teamName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const team = await Team.create({
      teamName,
      name: teamName,
      logo,
      matchesPlayed: 0,
      totalKills: 0,
      placementPoints: 0,
      totalPoints: 0,
      chickenDinners: 0,
    });

    const leaderboard = await fetchSortedLeaderboard();
    emitLeaderboardUpdated(leaderboard);

    return res.status(201).json({
      team,
      leaderboard,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 400;
    return res.status(status).json({ message: "Failed to create team", error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (req.body?.teamName !== undefined || req.body?.name !== undefined) {
      const nextName = normalizeTeamName(req.body || {});
      if (!nextName) {
        return res.status(400).json({ message: "Team name cannot be empty" });
      }
      team.teamName = nextName;
      team.name = nextName;
    }

    if (req.body?.logo !== undefined) {
      if (typeof req.body.logo !== "string") {
        return res.status(400).json({ message: "Logo must be a string URL" });
      }
      team.logo = req.body.logo.trim();
    }

    await team.save();

    const leaderboard = await fetchSortedLeaderboard();
    emitLeaderboardUpdated(leaderboard);

    return res.status(200).json({
      team,
      leaderboard,
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 400;
    return res.status(status).json({ message: "Failed to update team", error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Team.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Team not found" });
    }

    const leaderboard = await fetchSortedLeaderboard();
    emitLeaderboardUpdated(leaderboard);

    return res.status(200).json({
      message: "Team deleted successfully",
      leaderboard,
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to delete team", error: error.message });
  }
};