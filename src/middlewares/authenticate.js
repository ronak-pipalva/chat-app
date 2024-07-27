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
      return next(new createError(400, "invalid Secretkey"));
    }

    const isVerify = decodeToken === config.adminSecretKey;

    if (isVerify) {
      next();
    } else {
      return next(new createError(400, "Secretkey not matched"));
    }
  } catch (error) {
    next(error);
  }
};

const socketAuthenticator = async (socket, next) => {
  try {
    const authToken = socket.request.cookies.accessToken;

    if (!authToken) {
      return next(new createError(401, "please login to access this route"));
    }

    const decodeToken = jwt.verify(authToken, config.tokenSecret);

    const user = await User.findById(decodeToken._id);

    if (!user) {
      return next(new createError(401, "please login to access this route"));
    }
    socket.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

export { authenticate, adminOnly, socketAuthenticator };
