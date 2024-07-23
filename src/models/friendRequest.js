import mongoose, { Schema, Types } from "mongoose";

const schema = new Schema(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const FriendRequest = mongoose.model("FriendRequest", schema);
