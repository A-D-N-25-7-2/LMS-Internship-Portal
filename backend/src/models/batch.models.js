import mongoose, { Schema } from "mongoose";

const batchSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    program: {
      type: mongoose.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"],
      default: "upcoming",
    },
  },
  { timestamps: true },
);

export const Batch = mongoose.model("Batch", batchSchema);
