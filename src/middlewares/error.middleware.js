const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.success === false) {
    return res.status(statusCode).json({
      success: false,
      message: message,
      errors: err.errors || []
    });
  }

  res.status(statusCode).json({
    success: false,
    message: message
  });
};

export { errorHandler };
