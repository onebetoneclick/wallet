const express = require("express");

const router = express.Router();

const {

    registerUser,
    verifyEmail,
    resendOTP,
    loginUser,
    verifyLoginOTP,
    testProfile

} = require("../controllers/authController");



/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post(
    "/register",
    registerUser
);



/*
|--------------------------------------------------------------------------
| VERIFY REGISTER EMAIL OTP
|--------------------------------------------------------------------------
*/

router.post(
    "/verify-email",
    verifyEmail
);



/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
*/

router.post(
    "/resend-otp",
    resendOTP
);



/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    loginUser
);



/*
|--------------------------------------------------------------------------
| VERIFY LOGIN OTP
|--------------------------------------------------------------------------
*/

router.post(
    "/verify-login",
    verifyLoginOTP
);


router.post("/test-profile", testProfile);
module.exports = router;
