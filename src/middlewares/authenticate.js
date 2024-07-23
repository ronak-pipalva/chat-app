import config from "../config/config.js";
import User from "../models/user.js";
import { Const } from "../utils/constant.js";
import createError from "../utils/createError.js";
import jwt from "jsonwebtoken";

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next(new createError(404, "access token is required"));
    }

    const decodeToken = jwt.verify(token, config.tokenSecret);

    if (!decodeToken) {
      return next(new createError(400, "invalid access token"));
    }

    const user = await User.findById(decodeToken._id);

    if (!user) {
      return next(new createError(401, "you are not authorized"));
    }
    req.userId = user._id;

    next();
  } catch (error) {
    next(error);
  }
};

const adminOnly = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next(new createError(404, "access token is required"));
    }

    const decodeToken = jwt.verify(token, config.tokenSecret);

    if (!decodeToken) {
      return next(new createError(400, "invalid access token"));
    }

    console.log("decodeToken", decodeToken);

    const isVerify = decodeToken === config.adminSecretKey;

    if (isVerify) {
      next();
    }
  } catch (error) {
    next(error);
  }
};

export { authenticate, adminOnly };
