import express from "express";
import {
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
} from "../controllers/user.js";
import authenticate from "../middlewares/authenticate.js";
import {
  handleValidator,
  loginValidator,
  registerValidator,
} from "../utils/validator.js";

const userRoute = express.Router();

userRoute.post("/new", registerValidator(), handleValidator, newUser);
userRoute.post("/login", loginValidator(), handleValidator, login);

//after here user must be logged
userRoute.use(authenticate);
userRoute.put("/logout", logout);
userRoute.get("/me", getMyProfile);
userRoute.get("/search", searchUser);
export default userRoute;
