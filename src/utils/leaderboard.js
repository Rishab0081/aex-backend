import Team from "../models/Team.js";

export const leaderboardSort = {
  totalPoints: -1,
  totalKills: -1,
  teamName: 1,
};

export const fetchSortedLeaderboard = async () => {
  return Team.find().sort(leaderboardSort);
};