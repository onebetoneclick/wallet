const express = require("express");

const router = express.Router();

const {
    checkAccount,
    sendActivationOTP,
    verifyActivationOTP,
    activateWallet
} = require("../controllers/walletController");

/*
|--------------------------------------------------------------------------
| Wallet Routes
|--------------------------------------------------------------------------
*/

// Verify bank account and return account name
router.post("/check-account", checkAccount);

// Send email OTP before wallet activation
router.post("/send-activation-otp", sendActivationOTP);

// Verify email OTP
router.post("/verify-activation-otp", verifyActivationOTP);

// Activate wallet / Create or return DVA
router.post("/activate", activateWallet);

module.exports = router;
