const asyncHandler = require("express-async-handler");
const ErrorHandler = require("../utils/customErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token || !token.startsWith("Bearer ")) {
        return next(new ErrorHandler("Please include a valid token", 401));
    }

    const tokenString = token.split(" ")[1];

    try {
        const decodedData = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.user = await User.findById(decodedData.id);
        next();
    } catch (error) {
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
});

exports.authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role ${req.user.role} is not allowed to access this role`, 403))
        }
        next();
    }
}