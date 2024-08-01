const globalErrorHandler = (err, req, res, next) => {
  if (err.name === "CastError") {
    const errorPath = err.path;
    err.message = `Invalid formate of ${errorPath}`;
    err.statusCode = 400;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message: message,
  });
};

export default globalErrorHandler;
