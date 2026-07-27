const express = require("express");

const router = express.Router();

const {
    createDedicatedAccount,
    getDedicatedAccount
} = require("../controllers/dedicatedAccountController");

/*
|--------------------------------------------------------------------------
| Create Dedicated Account
|--------------------------------------------------------------------------
|
| POST /api/dedicated-account/create
|
*/

router.post(
    "/create",
    createDedicatedAccount
);

/*
|--------------------------------------------------------------------------
| Get Dedicated Account
|--------------------------------------------------------------------------
|
| GET /api/dedicated-account/:id
|
*/

router.get(
    "/:id",
    getDedicatedAccount
);

/*
|--------------------------------------------------------------------------
| Export Router
|--------------------------------------------------------------------------
*/

module.exports = router;
