let ioRef = null;

export const setSocketIO = (io) => {
  ioRef = io;
};

export const emitLeaderboardUpdated = (updatedTeams = null) => {
  if (!ioRef) {
    return;
  }

  ioRef.emit("leaderboardUpdated", updatedTeams);
};