import express from "express";
import {
  acceptFriendRequest,
  getAllNotifications,
  getFriends,
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
  sendFriendRequest,
} from "../controllers/user.js";
import { authenticate } from "../middlewares/authenticate.js";
import {
  acceptFriendRequestValidator,
  handleValidator,
  loginValidator,
  registerValidator,
  sendAttachmentValidator,
  sendFriendRequestValidator,
} from "../utils/validator.js";
import upload from "../middlewares/multer.js";

const userRoute = express.Router();

userRoute.post(
  "/new",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  registerValidator(),
  handleValidator,
  newUser
);
userRoute.post("/login", loginValidator(), handleValidator, login);

//after here user must be logged
userRoute.use(authenticate);
userRoute.put("/logout", logout);
userRoute.get("/me", getMyProfile);
userRoute.get("/search", searchUser);
userRoute.put(
  "/send-request",
  sendFriendRequestValidator(),
  handleValidator,
  sendFriendRequest
);
userRoute.put(
  "/accept-request",
  acceptFriendRequestValidator(),
  handleValidator,
  acceptFriendRequest
);
userRoute.get("/notifications", getAllNotifications);
userRoute.get("/friends", getFriends);

export default userRoute;
