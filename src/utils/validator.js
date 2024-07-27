import { body, check, param, validationResult } from "express-validator";
import createError from "./createError.js";

const handleValidator = (req, res, next) => {
  const errros = validationResult(req);
  const errrosMessages = errros
    .array()
    .map((err) => err.msg)
    .join(", ");

  if (errros.isEmpty()) {
    return next();
  } else next(new createError(400, errrosMessages));
};
const registerValidator = () => [
  body("name").notEmpty().withMessage("Please enter name"),
  body("username").notEmpty().withMessage("Please enter username"),
  body("password").notEmpty().withMessage("Please enter password"),
  body("bio").notEmpty().withMessage("Please enter bio"),
  body("avatar").custom((value, { req }) => {
    if (!req.files || !req.files.avatar) {
      throw new Error("Please upload avatar");
    }
    return true;
  }),
];

const loginValidator = () => [
  body("username", "please enter username").notEmpty(),
  body("password", "please enter password").notEmpty(),
];

const createGroupValidator = () => [
  body("name", "please enter name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("please enter password")
    .isArray({ min: 2, max: 99 })
    .withMessage("Member must be 2-99"),
];

const addMembersValidator = () => [
  body("chatId", "please enter chatId").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("please enter password")
    .isArray({ min: 1, max: 99 })
    .withMessage("Member must be 1-97"),
];

const removeMemberValidator = () => [
  body("chatId", "please enter chatId").notEmpty(),
  body("memberId", "please enter memberId").notEmpty(),
];

const leaveGroupValidator = () => [
  param("id", "plese enter chat ID").notEmpty(),
];

const sendAttachmentValidator = () => [
  body("chatId", "please enter chatId").notEmpty(),
  body("files")
    .custom((value, { req }) => req.files && req.files.length > 0)
    .withMessage("Please upload attachments")
    .custom((value, { req }) => req.files.length <= 5)
    .withMessage("Attachments must be 1-5"),
];

const getMessagesValidator = () => [
  param("id", "please enter chat ID").notEmpty(),
];

const chatIdValidator = () => [param("id", "please enter chat ID").notEmpty()];

const sendFriendRequestValidator = () => [
  body("receiverId", "please enter receiver user Id").notEmpty(),
];

const acceptFriendRequestValidator = () => [
  body("requestId", "please enter request Id").notEmpty(),
  body("isAccepted")
    .notEmpty()
    .withMessage("please enter isAccepted flag")
    .isBoolean()
    .withMessage("isAccepted must be boolena value"),
];

const adminLoginValidator = () => [
  body("secretKey", "please enter admin secretKey").notEmpty(),
];
export {
  handleValidator,
  registerValidator,
  loginValidator,
  createGroupValidator,
  addMembersValidator,
  leaveGroupValidator,
  removeMemberValidator,
  sendAttachmentValidator,
  getMessagesValidator,
  chatIdValidator,
  sendFriendRequestValidator,
  acceptFriendRequestValidator,
  adminLoginValidator,
};
