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

const emitEvent = (req, event, users, data) => {
  console.log("Emmiting event", event);
};

const getOtherMember = (member, userId) => {
  return member.filter((member) => member._id.toString() !== userId.toString());
};

const deleteFilesFromCloudinary = (public_ids) => {};

export {
  tryCatch,
  apiResponse,
  emitEvent,
  getOtherMember,
  deleteFilesFromCloudinary,
};
