import { userSocketIDs } from "../app.js";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import fs from "fs";

const tryCatch = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    next(error);
  }
};

const apiResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success: success,
    message: message,
    data: data,
    statusCode: statusCode,
  };
};

const getOtherMember = (member, userId) => {
  return member.filter((member) => member.toString() !== userId.toString());
};

export const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIDs.get(user.toString()));
  return sockets;
};

const emitEvent = (req, event, users, data) => {
  let io = req.app.get("io");
  const userSocket = getSockets(users);
  io.io(userSocket).emit(event, data);
  // console.log("Emmiting event", event);
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map(async (file) => {
    try {
      const results = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
        public_id: uuid(),
      });

      await fs.promises.unlink(file);
      return { public_id: results.public_id, url: results.secure_url };
    } catch (error) {
      await fs.promises.unlink(file);
      throw new Error(error);
    }
  });
  const result = await Promise.all(uploadPromises);

  return result;
};

const deleteFilesFromCloudinary = (public_ids) => {};

export {
  tryCatch,
  apiResponse,
  emitEvent,
  getOtherMember,
  deleteFilesFromCloudinary,
  uploadFilesToCloudinary,
};
