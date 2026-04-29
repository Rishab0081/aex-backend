import mongoose from "mongoose";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import { fetchSortedLeaderboard } from "../utils/leaderboard.js";
import { emitLeaderboardUpdated } from "../utils/socket.js";

const getPlacementPoints = (rank) => {
  if (rank === 1) return 10;
  if (rank === 2) return 6;
  if (rank === 3) return 5;
  return 0;
};

const parseNonNegativeNumber = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
  return parsed;
};

const parsePositiveRank = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Rank must be a positive integer");
  }
  return parsed;
};

export const addMatch = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const incomingResults = req.body?.results;

    if (!Array.isArray(incomingResults) || incomingResults.length === 0) {
      return res.status(400).json({ message: "Match results are required" });
    }

    const normalizedResults = [];
    const teamIdsSeen = new Set();
    const rankSeen = new Set();

    for (const entry of incomingResults) {
      const teamId = String(entry?.teamId || "").trim();

      if (!mongoose.isValidObjectId(teamId)) {
        return res.status(400).json({ message: "Invalid teamId in results" });
      }

      if (teamIdsSeen.has(teamId)) {
        return res.status(400).json({ message: "Duplicate team entry found in match results" });
      }
      teamIdsSeen.add(teamId);

      const kills = parseNonNegativeNumber(entry?.kills, "Kills");
      const rank = parsePositiveRank(entry?.rank);

      if (rankSeen.has(rank)) {
        return res.status(400).json({ message: "Duplicate rank found in match results" });
      }
      rankSeen.add(rank);

      normalizedResults.push({
        teamId,
        kills,
        rank,
        placementPoints: getPlacementPoints(rank),
      });
    }

    const teamIds = normalizedResults.map((item) => item.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } });

    if (teams.length !== teamIds.length) {
      return res.status(404).json({ message: "One or more teams were not found" });
    }

    const teamMap = new Map(teams.map((team) => [String(team._id), team]));

    session.startTransaction();

    const lastMatch = await Match.findOne().sort({ matchNumber: -1 }).session(session);
    const nextMatchNumber = (lastMatch?.matchNumber || 0) + 1;

    for (const result of normalizedResults) {
      const team = teamMap.get(result.teamId);

      team.matchesPlayed += 1;
      team.totalKills += result.kills;
      team.placementPoints += result.placementPoints;

      if (result.rank === 1) {
        team.chickenDinners += 1;
      }

      team.totalPoints = team.totalKills + team.placementPoints;

      await team.save({ session });
    }

    const [createdMatch] = await Match.create(
      [
        {
          matchNumber: nextMatchNumber,
          results: normalizedResults.map((result) => ({
            teamId: result.teamId,
            kills: result.kills,
            rank: result.rank,
          })),
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const updatedTeams = await fetchSortedLeaderboard();
    emitLeaderboardUpdated(updatedTeams);

    return res.status(201).json({
      message: "Match Added",
      match: createdMatch,
      leaderboard: updatedTeams,
    });
  } catch (error) {
    await session.abortTransaction();
    const status = error.message?.includes("must") || error.message?.includes("Rank") ? 400 : 500;

    return res.status(status).json({
      message: "Failed to add match",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};