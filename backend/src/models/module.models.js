import mongoose, { Schema } from "mongoose";

const moduleSchema = Schema({
    name : {
        type: String,
        required: true,
    },
    description : {
        type: String
    },
    program: {
        type: Schema.Types.ObjectId,
        ref: "Program",
        required: true
    },
    order: {
        type: Number,
        required: true
    }
}, { timestamps: true });

export const Module = mongoose.model("Module", moduleSchema);
