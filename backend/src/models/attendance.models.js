import mongoose, { Schema } from "mongoose";

const attendanceSchema = Schema(
  {
    intern: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      default: "absent",
    },
    activeSeconds: {
      type: Number,
      default: 0,
    },
    lastHeartbeatAt: {
      type: Date,
    },
    markedAt: {
      type: Date,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ date: 1, batch: 1, intern: 1 }, { unique: true });
attendanceSchema.index({ batch: 1, date: 1 });

export const Attendance = mongoose.model("Attendance", attendanceSchema);