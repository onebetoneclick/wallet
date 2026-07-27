const express = require("express");

const router = express.Router();

const {
    handlePaystackWebhook
} = require("../controllers/webhookController");

/*
|--------------------------------------------------------------------------
| Paystack Webhook
|--------------------------------------------------------------------------
|
| POST /api/webhook/paystack
|
*/

router.post(
    "/paystack",
    handlePaystackWebhook
);

module.exports = router;
