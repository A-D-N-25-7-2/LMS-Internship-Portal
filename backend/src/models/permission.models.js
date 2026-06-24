import mongoose, { Schema } from "mongoose";

const permissionSchema = new Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true
    },
    resource: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    }
  },
  { timestamps: true },
);

export const Permission = mongoose.model("Permission", permissionSchema);
