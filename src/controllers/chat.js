import { Chat } from "../models/chat.js";
import User from "../models/user.js";
import { Const } from "../utils/constant.js";
import createError from "../utils/createError.js";
import {
  apiResponse,
  deleteFilesFromCloudinary,
  emitEvent,
  getOtherMember,
  tryCatch,
  uploadFilesToCloudinary,
} from "../utils/utilityFunctions.js";
import { Message } from "../models/mesaage.js";

const newGroupChat = tryCatch(async (req, res, next) => {
  const { name, members } = req.body;

  const allMembers = [...members, req.userId];

  await Chat.create({
    name,
    groupChat: true,
    creator: req.userId,
    members: allMembers,
  });

  emitEvent(req, Const.events.alert, allMembers, `Welcome to ${name} group`);
  emitEvent(req, Const.events.refetchChats, members);

  res.status(200).json(apiResponse(true, "group chat created successfully"));
});

const getMyChats = tryCatch(async (req, res, next) => {
  const chats = await Chat.find({ members: req.userId }).populate(
    "members",
    "name avatar"
  );

  const transformedChats = chats.map((chat) => {
    const otherMember = getOtherMember(chat.members, req.userId);
    return {
      _id: chat._id,
      avatar: chat.groupChat
        ? chat.members.slice(0, 3).map(({ avatar }) => avatar.url)
        : [otherMember.avatar.url],
      groupChat: chat.groupChat,
      name: chat.groupChat ? chat.name : otherMember.name,
      members: chat.members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.userId.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),

      //chat.members.filter(i=>i_id.toString()!==req.userId.toString()).map(i=>i_id)
    };
  });

  res
    .status(200)
    .json(apiResponse(true, "chat fetch successfully", transformedChats));
});

const getMyGroups = tryCatch(async (req, res, next) => {
  const chat = await Chat.find({ members: req.userId }).populate(
    "members",
    "name avatar"
  );

  const groups = chat.map(({ _id, groupChat, members, name }) => ({
    _id,
    groupChat,
    members,
    name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
  }));

  res.status(200).json(apiResponse(true, "list of my groups", groups));
});

const addMembers = tryCatch(async (req, res, next) => {
  const { chatId, members } = req.body;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new createError(404, "chat not found"));
  }
  if (!chat.groupChat) {
    return next(new createError(404, "this is not group chat"));
  }
  if (chat.creator.toString() !== req.userId.toString()) {
    return next(new createError(403, "you are not allowed to add members"));
  }

  const allNewMembersPromis = members.map((i) =>
    User.findById(i).select("name")
  );

  const allNewMembers = await Promise.all(allNewMembersPromis);

  const uniqueMembers = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniqueMembers);

  if (chat.members.length > 100) {
    return next(new createError(400, "Group member limit reached"));
  }

  await chat.save();

  const allMembersName = allNewMembers.map((i) => i.name).join(",");

  emitEvent(
    req,
    Const.events.alert,
    chat.members,
    `${allMembersName} has been added to group`
  );

  emitEvent(req, Const.events.refetchChats, chat.members);

  res.status(200).json(apiResponse(true, "members added successfully"));
});

const removeMember = tryCatch(async (req, res, next) => {
  const { chatId, memberId } = req.body;

  const [chat, userThatWillBeRemove] = await Promise.all([
    Chat.findById(chatId),
    User.findById(memberId).select("name"),
  ]);

  if (!chat) {
    return next(404, "chat not found");
  }
  if (!userThatWillBeRemove) {
    return next(404, "member not found");
  }

  if (!chat.groupChat) {
    return next(new createError(404, "this is not group chat"));
  }
  if (chat.creator.toString() !== req.userId.toString()) {
    return next(new createError(403, "you are not allowed to add members"));
  }

  if (!chat.members.includes(memberId)) {
    return next(new createError(400, "member not part of group"));
  }

  if (chat.members.length <= 3) {
    return next(new createError(403, "Group must have at least 3 members"));
  }

  chat.members = chat.members.filter(
    (i) => i.toString() !== memberId.toString()
  );

  await chat.save();

  emitEvent(
    req,
    Const.events.alert,
    chat.members,
    `${userThatWillBeRemove.name} has been remove from the group`
  );

  emitEvent(req, Const.events.refetchChats, chat.members);

  res.status(200).json(apiResponse(true, "Member removed successfully"));
});

const leaveGroup = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new createError(404, "chat not found"));
  }
  if (!chat.groupChat) {
    return next(new createError(404, "this is not group chat"));
  }

  const remainnigMembers = getOtherMember(chat.members, req.userId);

  console.log("remainnigMembers", remainnigMembers);

  if (chat.creator.toString() == req.userId.toString()) {
    const randomCreator = Math.floor(Math.random() * remainnigMembers.length);
    const newCreator = remainnigMembers[randomCreator];
    chat.creator = newCreator;
  }

  chat.members = remainnigMembers;

  const [user] = await Promise.all([
    User.findById(req.userId).select("name"),
    chat.save(),
  ]);

  emitEvent(
    req,
    Const.events.alert,
    chat.members,
    `user ${user.name} has left the group`
  );

  emitEvent(req, Const.events.refetchChats, chat.members);

  res
    .status(200)
    .json(apiResponse(true, "user leave group successfully", null));
});

const sendAttachment = tryCatch(async (req, res, next) => {
  const { chatId } = req.body;

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.userId).select("name"),
  ]);

  const localFilePaths = req.files.map((item) => item.path);

  const attachment = await uploadFilesToCloudinary(localFilePaths);

  const messageForDB = {
    content: "",
    attachments: attachment,
    sender: me._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDB,
    sender: { _id: me._id, name: me.name },
  };

  const message = await Message.create(messageForDB);

  emitEvent(req, Const.events.newAttachment, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitEvent(req, Const.events.newMessageAlert, chat.members, { chatId });

  res.status(200).json(apiResponse(true, "message send successfully", message));
});

const getChatDetails = tryCatch(async (req, res, next) => {
  if (req.query.populate == "true") {
    const chat = await Chat.findById(req.params.id).populate(
      "members",
      "name avatar"
    );

    if (!chat) {
      return next(new createError(400, "chat not found"));
    }
    res.status(200).json(apiResponse(true, "chat fetch successfully", chat));
  } else {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return next(new createError(400, "chat not found"));
    }
    res.status(200).json(apiResponse(true, "chat fetch successfully", chat));
  }
});

const renameGroup = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const { name } = req.body;

  if (!name || name.length == 0) {
    return next(new createError(400, "name is required"));
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new createError(400, "chat not found"));
  }

  if (chat.creator.toString() !== req.userId.toString()) {
    return next(
      new createError(400, "you are not allowed to rename the group")
    );
  }

  chat.name = name;

  await chat.save();

  res.status(200).json(apiResponse(true, "group rename successfully"));
});

const deleteChat = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new createError(404, "chat not found"));
  }

  if (
    !chat.groupChat &&
    chat.creator.toString() !== req.userId.toString &&
    !chat.members.includes(req.userId)
  ) {
    return next(new createError(401, "you are not allowed to delete chat"));
  }
  const messageWithAttachment = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $ne: [] },
  });

  const public_id = [];

  messageWithAttachment.forEach(({ attachments }) =>
    attachments.forEach((i) => public_id.push(i.public_id))
  );

  await Promise.all([
    deleteFilesFromCloudinary(public_id),
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  emitEvent(req, Const.events.refetchChats);

  res.status(200).json(apiResponse(true, "chat delete successfully"));
});

const getMessages = tryCatch(async (req, res, next) => {
  const chatId = req.params.id;

  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  const [messages, totalMessagesCount] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("sender", "name avatar")
      .lean(),
    ,
    Message.countDocuments({ chat: chatId }),
  ]);
  console.log(totalMessagesCount);
  const totalPage = Math.ceil(totalMessagesCount / limit) || 0;

  res
    .status(200)
    .json(
      apiResponse(true, "messages fetch successfully", { messages, totalPage })
    );
});
export {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMember,
  leaveGroup,
  sendAttachment,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
};
