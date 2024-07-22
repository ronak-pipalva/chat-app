import express from "express";
import {
  addMembers,
  deleteChat,
  getChatDetails,
  getMessages,
  getMyChats,
  getMyGroups,
  leaveGroup,
  newGroupChat,
  removeMember,
  renameGroup,
  sendAttachment,
} from "../controllers/chat.js";
import authenticate from "../middlewares/authenticate.js";
import upload from "../middlewares/multer.js";
import {
  addMembersValidator,
  chatIdValidator,
  createGroupValidator,
  getMessagesValidator,
  handleValidator,
  leaveGroupValidator,
  removeMemberValidator,
  sendAttachmentValidator,
} from "../utils/validator.js";

const chatRoute = express.Router();

chatRoute.use(authenticate);
chatRoute.post("/new", createGroupValidator(), handleValidator, newGroupChat);
chatRoute.get("/my-chats", getMyChats);
chatRoute.get("/my-groups", getMyGroups);
chatRoute.post(
  "/add-members",
  addMembersValidator(),
  handleValidator,
  addMembers
);
chatRoute.put(
  "/remove-member",
  removeMemberValidator(),
  handleValidator,
  removeMember
);
chatRoute.delete(
  "/leave-group/:id",
  leaveGroupValidator(),
  handleValidator,
  leaveGroup
);
chatRoute.post(
  "/message",
  upload.array("files", 5),
  sendAttachmentValidator(),
  handleValidator,
  sendAttachment
);
chatRoute.get(
  "/message/:id",
  getMessagesValidator(),
  handleValidator,
  getMessages
);

chatRoute
  .route("/:id")
  .get(chatIdValidator(), handleValidator, getChatDetails)
  .put(chatIdValidator(), handleValidator, renameGroup)
  .delete(chatIdValidator(), handleValidator, deleteChat);

export default chatRoute;
