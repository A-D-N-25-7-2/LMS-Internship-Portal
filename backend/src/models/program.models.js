import mongoose, { Schema } from "mongoose";

const programSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Program = mongoose.model("Program", programSchema);
