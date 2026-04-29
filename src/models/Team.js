import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    // Legacy compatibility for older records.
    name: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      type: String,
      trim: true,
      default: "",
    },
    matchesPlayed: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalKills: {
      type: Number,
      min: 0,
      default: 0,
    },
    placementPoints: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalPoints: {
      type: Number,
      min: 0,
      default: 0,
    },
    chickenDinners: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.pre("validate", function syncLegacyAndTotals(next) {
  if (!this.teamName && this.name) {
    this.teamName = this.name;
  }

  if (!this.name && this.teamName) {
    this.name = this.teamName;
  }

  this.totalPoints = (this.totalKills || 0) + (this.placementPoints || 0);
  next();
});

const Team = mongoose.model("Team", teamSchema);

export default Team;