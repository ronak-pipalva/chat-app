import mongoose, { Schema, Types } from "mongoose";

const schema = new Schema(
  {
    sender: {
      type: Types.ObjectId,
      ref: "User",
      require: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
      require: true,
    },
    content: {
      typeof: String,
    },
    attachments: [
      {
        public_id: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model("message", schema);
