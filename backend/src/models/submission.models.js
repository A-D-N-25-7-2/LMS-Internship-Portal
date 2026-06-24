import mongoose, { Schema } from "mongoose";

const submissionSchema = Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    intern: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    filePath: [
      {
        type: String
      },
    ],
    text: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted",
    },
    marks: {
      type: Number,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

submissionSchema.index({ assignment: 1, intern: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", submissionSchema);
