const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    succes: false,
    message: err.message || "Internal Server Error",
    error: err.errors || [],
  });
};

export { errorHandler };
