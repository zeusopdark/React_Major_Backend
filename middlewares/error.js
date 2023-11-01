const ErrorHandler = require('../utils/customErrorHandler')
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 404;
    err.message = err.message || "Internal Server Error";

    //Mongoose duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`
        err = new ErrorHandler(message, 400);
    }

    //Wrong jwt error
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid ,try again`
        err = new ErrorHandler(message, 400);
    }

    //JWT expire error
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is Expired ,try again`
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};