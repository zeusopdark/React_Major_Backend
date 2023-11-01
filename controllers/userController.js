const asyncHandler = require('express-async-handler');
const ErrorHandler = require("../utils/customErrorHandler");
const User = require('../models/userModel');
const sendToken = require('../utils/JWTToken');
const sendEmail = require("../utils/sendEmail.js")
const crypto = require("crypto");
const cloudinary = require("cloudinary");
//Register user

exports.registerUser = asyncHandler(async (req, res, next) => {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale"
    });
    const { name, email, password } = req.body;
    const user = await User.create({
        name, email, password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    });
    sendToken(user, 201, res);

});

//Login Users

exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email and Passowrd", 400));
    }
    const user = await User.findOne({ email }).select("+password"); //in defining the schema we had set the password select as false thats why.
    // console.log(user);

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    console.log(isPasswordMatched)
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401)); //unauthorized
    }

    sendToken(user, 200, res);
});

// Logout 

exports.logout = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    })
})

//Forget password

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }
    //get resetpasswordtoken
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `
    <a href="http://localhost:3000/password/reset/${resetToken}" 
    style="color: blue; text-decoration: underline;">
        Reset Password
    </a>
`;


    const message = `Your password reset click:- \n\n ${resetPasswordUrl} \n\n If you have not requested this  then , please ignore it.`
    try {

        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password  Recovery`,
            message,
        });
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully.`
        })

    } catch (error) {
        //since we save above if in case it get failed than we have to reset those 2 fields thats what we are doing here.
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler(error.message, 500));
    }
})

//  ResetPassword 
exports.resetPassword = asyncHandler(async (req, res, next) => {
    //creating the hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } })

    if (!user) {
        return next(new ErrorHandler("Reset Password token is invalid or has been expired", 400));
    }
    if (req.body.password != req.body.confirmPassword) {
        return next(new ErrorHandler("Password doesnot matched", 400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save();

    sendToken(user, 200, res);
})

//GetUserDetails
exports.getUserDetails = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(req.user.id, req.user._id);

    res.status(200).json({
        success: true,
        user
    })
})

//update user password

exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isMatched = await user.comparePassword(req.body.oldPassword)

    if (!isMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400))
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400))
    }
    user.password = req.body.newPassword
    await user.save()
    sendToken(user, 200, res)

    res.status(200).json({
        success: true,
        user
    })
})

//update user profile
exports.updateProfile = asyncHandler(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }
    if (req.body.avatar !== "") {
        const user = await User.findById(req.user.id);
        const imageId = user.avatar.public_id
        await cloudinary.v2.uploader.destroy(imageId);
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale"
        });
        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, { new: true, runValidators: true, useFindAndModify: false })

    res.status(200).json({
        success: true,
        user
    })
})

//Get all users(admin)
exports.getAllUser = asyncHandler(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})
//Get single users(admin)

exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not exist with user id ${req.params.id}`));
    }

    res.status(200).json({
        success: true,
        user
    })
})
//update User Role --Admin

exports.updateUserProfile = asyncHandler(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, { new: true, runValidators: true, useFindAndModify: false })

    res.status(200).json({
        success: true,
        user
    })
})

//Delete user --Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
            new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 400)
        );
    }

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne(user);

    res.status(200).json({
        success: true,
        message: "User Deleted Successfully",
    });
});
//