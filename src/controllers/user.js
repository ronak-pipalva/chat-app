import {
  apiResponse,
  emitEvent,
  getOtherMember,
  tryCatch,
} from "../utils/utilityFunctions.js";
import User from "../models/user.js";
import { Const } from "../utils/constant.js";
import createError from "../utils/createError.js";
import { Chat } from "../models/chat.js";
import { FriendRequest } from "../models/friendRequest.js";

const newUser = tryCatch(async (req, res, next) => {
  const avatar = {
    public_id: "sdvasfs",
    url: "sdvsdvs",
  };
  const { name, username, password, bio } = req.body;

  const existUser = await User.findOne({ username });

  if (existUser) {
    return next(new createError(400, "user alredy exist"));
  }
  const userData = await User.create({ name, username, password, bio, avatar });

  const accessToken = await userData.generateToken();

  const userResponse = userData.toObject();
  delete userResponse.password;
  res
    .status(201)
    .cookie("accessToken", accessToken, Const.cookieOption)
    .json(apiResponse(true, "User created successfully", userResponse));
});

const login = tryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) {
    return next(new createError(404, "user not found"));
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return next(new createError(404, "invalid password"));
  }

  const accessToken = await user.generateToken();
  const userResponse = user.toObject();
  delete userResponse.password;
  res
    .status(200)
    .cookie("accessToken", accessToken, Const.cookieOption)
    .json(apiResponse(true, "user login successfully", userResponse));
});

const logout = tryCatch(async (req, res, next) => {
  res
    .status(200)
    .cookie("accessToken", "", { ...Const.cookieOption, maxAge: 0 })
    .json(apiResponse(true, "logout successfully"));
});

const getMyProfile = tryCatch(async (req, res, next) => {
  const userId = req.userId;

  console.log("userId", userId);

  const user = await User.findById(userId);

  if (!user) {
    return new new createError(404, "user not found")();
  }

  res
    .status(200)
    .json(apiResponse(true, "user detail fetch successfully", user));
});

const searchUser = tryCatch(async (req, res, next) => {
  const chat = await Chat.find({ groupChat: false, members: req.userId });

  const { name } = req.query;

  const allUsersFromMyChats = chat.map((i) => i.members).flat();

  const allUserExceptMeAndFiends = await User.find({
    _id: { $nin: allUsersFromMyChats },
    name: { $regex: name, $options: "i" },
  });

  const users = allUserExceptMeAndFiends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));
  res.status(200).json(apiResponse(true, "search user list", users));
});

const sendFriendRequest = tryCatch(async (req, res, next) => {
  const { receiverId } = req.body;

  const request = await FriendRequest.findOne({
    $or: [
      { sender: req.userId, receiver: receiverId },
      { sender: receiverId, receiver: req.userId },
    ],
  });

  if (request) {
    return next(new createError(400, "Friend Request already sent"));
  }

  await FriendRequest.create({ sender: req.userId, receiver: receiverId });

  emitEvent(req, Const.events.newFriendRequest, [receiverId]);

  res.status(200).json(apiResponse(true, "Friend Request sent"));
});

const acceptFriendRequest = tryCatch(async (req, res, next) => {
  const { requestId, isAccepted } = req.body;

  const request = await FriendRequest.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) {
    return next(new createError(404, "Friend Request not found"));
  }
  if (request.receiver._id.toString() !== req.userId.toString()) {
    return next(
      new createError(404, "you are not authorize to accept request")
    );
  }
  if (!isAccepted) {
    await request.deleteOne();
    res.status(200).json(apiResponse(true, "Friend Request rejected"));
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, Const.events.refetchChats, members);

  res.status(200).json(apiResponse(true, "Friend Request accepted "));
});

const getAllNotifications = tryCatch(async (req, res, next) => {
  const request = await FriendRequest.find({ receiver: req.userId })
    .populate("sender", "name avatar")
    .select("sender");

  res
    .status(200)
    .json(apiResponse(true, "notifications fetch successfully", request));
});

const getFriends = tryCatch(async (req, res, next) => {
  const chats = await Chat.find({
    groupChat: false,
    members: req.userId,
  }).populate("members", "name avatar");

  const friends = chats.map(({ members }) => {
    const otherMember = getOtherMember(members, req.userId);
    return {
      _id: otherMember[0]._id,
      name: otherMember[0].name,
      avatar: otherMember[0].avatar.url,
    };
  });
  res
    .status(200)
    .json(apiResponse(true, "friends fetch successfully", friends));
});
export {
  newUser,
  login,
  logout,
  getMyProfile,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getAllNotifications,
  getFriends,
};
