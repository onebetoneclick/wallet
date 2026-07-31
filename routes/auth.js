const express = require("express");

const router = express.Router();

const {

    registerUser,

    verifyEmail,

    resendOTP

} = require("../controllers/authController");

router.post("/register", registerUser);

router.post("/verify-email", verifyEmail);

router.post("/resend-otp", resendOTP);

module.exports = router;
