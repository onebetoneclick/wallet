const express = require("express");

const router = express.Router();

const {

    checkAccount,
    verifyUser,
    sendActivationOTP,
    verifyActivationOTP,
    activateWallet,
    getExistingWallet,
    getWalletStatus

} = require("../controllers/walletController");

/*
|--------------------------------------------------------------------------
| Verify Bank Account
|--------------------------------------------------------------------------
*/

router.post("/check-account", checkAccount);

/*
|--------------------------------------------------------------------------
| Verify User
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
| Get Existing Wallet
|--------------------------------------------------------------------------
*/

router.post("/existing-wallet", getExistingWallet);

/*
|--------------------------------------------------------------------------
| Activate Wallet
|--------------------------------------------------------------------------
*/

router.post("/activate", activateWallet);

/*
|--------------------------------------------------------------------------
| Wallet Status
|--------------------------------------------------------------------------
*/

router.post("/status", getWalletStatus);

module.exports = router;
