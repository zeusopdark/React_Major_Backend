const express = require("express");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/auth")
const { processPayment, sendStripeKey } = require("../controllers/paymentController")

router.route("/payment/process").post(isAuthenticatedUser, processPayment);
router.route("/stripeapikey").get(isAuthenticatedUser, sendStripeKey)
module.exports = router;