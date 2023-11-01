const express = require('express')
const { getAllProducts, getProduct, updateProducts, deleteProduct, createProduct, createProductReview, getProductReviews, deleteReview, getAdminProducts } = require("../controllers/productController")
const router = express.Router()
const { isAuthenticatedUser, authorizedRoles } = require('../middlewares/auth')

router.route("/products")
    .get(getAllProducts)

router.route("/admin/products").get(isAuthenticatedUser, authorizedRoles("admin"), getAdminProducts)

router.route("/admin/products/new")
    .post(isAuthenticatedUser, authorizedRoles("admin"), createProduct)

router.route("/admin/products/:id")
    .put(isAuthenticatedUser, authorizedRoles("admin"), updateProducts)
    .delete(isAuthenticatedUser, authorizedRoles("admin"), deleteProduct)

router.route("/product/:id")
    .get(getProduct)

router.route("/review").put(isAuthenticatedUser, createProductReview)
router.route("/reviews").get(getProductReviews)
    .delete(isAuthenticatedUser, deleteReview)


module.exports = router