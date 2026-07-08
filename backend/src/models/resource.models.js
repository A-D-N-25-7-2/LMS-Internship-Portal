import mongoose, { Schema } from "mongoose";

const resourceSchema = new Schema(
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
    files: [
      {
        name: { type: String, required: true },
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
      },
    ],
    links: [
      {
        label: {
          type: String,
        },
        link: {
          type: String,
        },
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const Resource = mongoose.model("Resource", resourceSchema);
