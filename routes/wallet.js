const express = require("express");

const router = express.Router();

const {

    checkAccount,

    sendActivationOTP,

    verifyActivationOTP,

    activateWallet,

    verifyUser,

    getWallet

} = require("../controllers/walletController");

/*
|--------------------------------------------------------------------------
| Verify Bank Account
|--------------------------------------------------------------------------
*/

router.post("/check-account", checkAccount);

/*
|--------------------------------------------------------------------------
| Verify User Details
|--------------------------------------------------------------------------
*/

router.post("/verify-user", verifyUser);

/*
|--------------------------------------------------------------------------
| Send Wallet Activation OTP
|--------------------------------------------------------------------------
*/

router.post("/send-activation-otp", sendActivationOTP);

/*
|--------------------------------------------------------------------------
| Verify Wallet Activation OTP
|--------------------------------------------------------------------------
*/

router.post("/verify-activation-otp", verifyActivationOTP);

/*
|--------------------------------------------------------------------------
| Activate Wallet
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Get Existing Wallet
|--------------------------------------------------------------------------
*/

router.post("/get-wallet", getWallet);

router.post("/activate", activateWallet);

module.exports = router;
