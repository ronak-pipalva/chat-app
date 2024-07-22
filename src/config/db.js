import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", (data) => {
      console.log("DB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("DB connection error:", err);
      process.exit(1);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("DB disconnected");
    });

    await mongoose.connect(config.mongodbConnectionUrl);
  } catch (error) {
    console.error("Failed to connect to database", error);
    process.exit(1);
  }
};

export default connectDB;
