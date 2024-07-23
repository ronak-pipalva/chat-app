export const Const = {
  tokenExpire: 15 * 24 * 60 * 60 * 1000, //15day,

  cookieOption: {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
  },

  events: {
    alert: "ALERT",
    refetchChats: "REFETCH_CHATS",
    newAttachment: "NEW_ATTACHMENT",
    newMessageAlert: "NEW_MESSAGE_ALERT",
    newFriendRequest: "NEW_FRIEND_REQUEST",
  },
};
