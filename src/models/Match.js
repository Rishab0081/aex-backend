import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    kills: {
      type: Number,
      required: true,
      min: 0,
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    matchNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    results: {
      type: [resultSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one team result is required",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model("Match", matchSchema);

export default Match;