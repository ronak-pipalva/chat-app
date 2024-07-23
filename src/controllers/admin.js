import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/mesaage.js";
import User from "../models/user.js";
import createError from "../utils/createError.js";
import { apiResponse, tryCatch } from "../utils/utilityFunctions.js";
import { Const } from "../utils/constant.js";

const adminLogin = tryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  const isMatched = config.adminSecretKey === secretKey;

  if (!isMatched) {
    return next(new createError(401, "Invalid secret key"));
  }

  const token = jwt.sign(secretKey, config.tokenSecret);

  res
    .status(200)
    .cookie("accessToken", token, Const.cookieOption)
    .json(apiResponse(true, "admin login successfully"));
});

const adminLogout = tryCatch(async (req, res, next) => {
  res
    .status(200)
    .cookie("accessToken", "", { ...Const.cookieOption, maxAge: 0 })
    .json(apiResponse(true, "admin logout successfully"));
});

const isAdmin = tryCatch(async (req, res, next) => {
  res
    .status(200)
    .json(apiResponse(true, "admin verify successfully", { admin: true }));
});
const allUsers = tryCatch(async (req, res, next) => {
  const users = await User.find({});

  const transformedUsers = await Promise.all(
    users.map(async ({ _id, name, username, avatar }) => {
      const [friends, groups] = await Promise.all([
        Chat.countDocuments({ groupChat: false, members: _id }),
        Chat.countDocuments({ groupChat: true, members: _id }),
      ]);

      return {
        _id,
        name,
        username,
        avatar: avatar.url,
        friends,
        groups,
      };
    })
  );

  res
    .status(200)
    .json(apiResponse(true, "list of all users", transformedUsers));
});

const allChats = tryCatch(async (req, res, next) => {
  const chats = await Chat.find({})
    .populate("members", "name avatar")
    .populate("creator", "name avatar");

  const transformedChats = await Promise.all(
    chats.map(async ({ _id, name, groupChat, members, creator }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });
      return {
        _id,
        name,
        avatar: members.slice(0, 3).map((member) => member.avatar.url),
        members,
        creator: {
          name: groupChat ? creator?.name : "none",
          avatar: groupChat ? creator.avatar.url : "",
        },
        totalMembers: members.length,
        totalMessages,
      };
    })
  );
  res
    .status(200)
    .json(apiResponse(true, "chat fetch successfully", transformedChats));
});

const allMessages = tryCatch(async (req, res, next) => {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");

  res
    .status(200)
    .json(apiResponse(true, "messages fetch successfully", messages));
});

const getDashboard = tryCatch(async (req, res, next) => {
  const [groupCount, userCount, messageCount, chatCount] = await Promise.all([
    Chat.countDocuments({ groupChat: true }),
    User.countDocuments(),
    Message.countDocuments(),
    Chat.countDocuments(),
  ]);

  const today = new Date();
  const last7day = new Date();
  last7day.setDate(last7day.getDate() - 7);
  console.log(last7day);

  const last7daysMessages = await Message.find({
    createdAt: { $gte: last7day, $lte: today },
  }).select("createdAt");

  const messagesChart = new Array(7).fill(0);

  const dayInMiliseconds = 1000 * 60 * 60 * 24;

  last7daysMessages.forEach((message) => {
    const index = Math.floor(
      (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds
    );
    messagesChart[6 - index]++;
  });
  const stats = {
    groupCount,
    userCount,
    messageCount,
    chatCount,
    messagesChart,
  };
  res
    .status(200)
    .json(apiResponse(true, "admin stats fetch successfully", stats));
});

export {
  adminLogin,
  adminLogout,
  isAdmin,
  allUsers,
  allChats,
  allMessages,
  getDashboard,
};
