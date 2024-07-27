import config from "../config/config.js";

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (err.name === "CastError") {
    const errorPath = err.path;
    err.message = `Invalid formate of ${errorPath}`;
    err.statusCode = 400;
  }
  // console.log(err);
  return res.status(statusCode).json({
    success: false,
    message: message,
  });
};

export default globalErrorHandler;
