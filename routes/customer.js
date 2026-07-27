const express = require("express");

const router = express.Router();

const {
    registerCustomer,
    getCustomer
} = require("../controllers/customerController");

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
|
| POST /api/customer/register
|
*/

router.post("/register", registerCustomer);

/*
|--------------------------------------------------------------------------
| Get Customer
|--------------------------------------------------------------------------
|
| GET /api/customer/:id
|
*/

router.get("/:id", getCustomer);

/*
|--------------------------------------------------------------------------
| Export Router
|--------------------------------------------------------------------------
*/

module.exports = router;
