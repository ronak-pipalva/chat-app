import express from "express";
import connectDB from "./config/db.js";
import config from "./config/config.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import { createChats, createMessages, createUsers } from "./utils/seeders.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/user", userRoute);
app.use("/chat", chatRoute);

app.listen(config.port, async () => {
  await connectDB();
  console.log(`application running on ${config.port}`);
});
//global Error handling
app.use(globalErrorHandler);
export default app;
