import mongoose, { Schema } from "mongoose";

const collegeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
})

export const College = mongoose.model("College", collegeSchema);
    
