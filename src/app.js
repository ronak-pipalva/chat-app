import express from "express";
import connectDB from "./config/db.js";
import config from "./config/config.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import { createServer } from "http";
import { createChats, createMessages, createUsers } from "./utils/seeders.js";
import { Server } from "socket.io";
import { Const } from "./utils/constant.js";
import { getOtherMember, getSockets } from "./utils/utilityFunctions.js";
import { Message } from "./models/mesaage.js";
import { v2 as cloudinary } from "cloudinary";
import { socketAuthenticator } from "./middlewares/authenticate.js";

cloudinary.config({
  cloud_name: "dylte0sf1",
  api_key: "177685847586997",
  api_secret: "Ggw3qaG3tmAvw-BjewtH26oEtYE",
});

const userSocketIDs = new Map();
const app = express();
const server = new createServer(app);
const io = new Server(server, {});

app.set("io", io);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/user", userRoute);
app.use("/chat", chatRoute);
app.use("/admin", adminRoutes);

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => {
    if (err) return next(err);
    await socketAuthenticator(socket, next);
  });
});
io.on("connection", (socket) => {
  const user = socket.user;

  userSocketIDs.set(user._id.toString(), socket.id);

  console.log("user connected", socket.id);

  socket.on(Const.events.newMessage, async ({ chatId, members, message }) => {
    console.log("userSocketIDs", userSocketIDs);
    const messageForRealTime = {
      content: message,
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };

    const membersSocket = getSockets(members);

    console.log("membersSocket", membersSocket);

    io.to(membersSocket).emit(Const.events.newMessage, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(Const.events.newMessageAlert, { chatId });

    await Message.create(messageForDB);
  });

  socket.on(Const.events.startTyping, async ({ members, chatId }) => {
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(Const.events.startTyping, { chatId });
  });

  socket.on(Const.events.stopTyping, async ({ members, chatId }) => {
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(Const.events.stopTyping, { chatId });
  });

  socket.on("dissconnect", () => {
    userSocketIDs.delete(user._id.toString());
    console.log("user disconnect");
  });
});

server.listen(config.port, async () => {
  await connectDB();
  console.log(`application running on ${config.port}`);
});
//global Error handling
app.use(globalErrorHandler);
export { app, userSocketIDs };
