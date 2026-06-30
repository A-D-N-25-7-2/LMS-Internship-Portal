import mongoose, { Schema } from "mongoose";

const assignmentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
  },
  { timestamps: true },
);

export const Assignment = mongoose.model("Assignment", assignmentSchema);
