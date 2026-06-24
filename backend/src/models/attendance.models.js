import mongoose, { Schema } from "mongoose";

const attendanceSchema = Schema({
    batch: {
        type: Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    markedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    record: [
        {
            intern: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            status: {
                type: String,
                enum: ['present', 'absent'],
                required: true
            }
        }
    ]
}, { timestamps: true });

attendanceSchema.index({ batch: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
