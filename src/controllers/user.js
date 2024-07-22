import { apiResponse, tryCatch } from "../utils/utilityFunctions.js";
import User from "../models/user.js";
import { Const } from "../utils/constant.js";
import createError from "../utils/createError.js";
import { Chat } from "../models/chat.js";

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

const searchUser = async (req, res, next) => {
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
};
export { newUser, login, logout, getMyProfile, searchUser };
