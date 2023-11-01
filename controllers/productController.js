const Product = require("../models/productModel");
const asyncHandler = require('express-async-handler');
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/customErrorHandler");
const ApiFeatures = require("../utils/apiFeatures")
// Create product Admin
exports.createProduct = asyncHandler(async (req, res, next) => {

    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }

    req.body.images = imagesLinks;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product,
    });

})

//get all products 
exports.getAllProducts = asyncHandler(async (req, res, next) => {
    const resultPerPage = 8;
    const productCount = await Product.countDocuments();
    // console.log(req.user);
    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter();

    let products = await apiFeature.query.clone();

    let filteredProductsCount = products.length;

    apiFeature.pagination(resultPerPage);

    products = await apiFeature.query;
    res.status(200).json({ success: true, products, productCount, resultPerPage, filteredProductsCount });
});

// get all product admin 
exports.getAdminProducts = asyncHandler(async (req, res, next) => {

    const products = await Product.find()
    res.status(200).json({ success: true, products });
});
//get Product Details

exports.getProduct = asyncHandler(async (req, res, next) => {

    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }
    res.status(200).json({ success: true, product });

})

//Update Product --Admin

exports.updateProducts = asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHander("Product not found", 404));
    }

    // Images Start Here
    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    if (images !== undefined) {
        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }

        req.body.images = imagesLinks;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        product,
    });
});


exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }
    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }
    await product.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: "Product Deleted successfully" });
})
//Create new review or update the review

exports.createProductReview = asyncHandler(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    console.log(rating, comment, productId);
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    };
    const product = await Product.findById(productId)
    const isReviewd = product.review.find(rev => rev.user.toString() === req.user._id.toString())

    if (isReviewd) {
        product.review.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString())
                rev.rating = rating, rev.comment = comment;
        })
    } else {
        product.review.push(review);
        product.numOfReviews = product.review.length
    }

    let avg = 0;
    product.review.forEach((rev) => {
        avg += rev.rating
    })

    product.rating = avg / product.review.length;

    await product.save({ validateBeforeSave: false })

    res.status(200).json({ success: true, });

})

//Get all reviews of a product

exports.getProductReviews = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({ success: true, reviews: product.review });

});

// Delete review
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const reviews = product.review.filter(rev => rev._id.toString() !== req.query.id.toString())
    let avg = 0;
    reviews.forEach((rev) => {
        avg += rev.rating
    })

    const ratings = avg / reviews.length;
    const numOfReviews = reviews.length;
    const review = reviews
    await Product.findByIdAndUpdate(req.query.productId, { review, ratings, numOfReviews }, { new: true, runValidators: true, useFindAndModify: false })

    res.status(200).json({
        success: true
    })

})

