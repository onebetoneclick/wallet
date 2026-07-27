require("dotenv").config();

const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer");
const dedicatedAccountRoutes = require("./routes/dedicatedAccount");
const webhookRoutes = require("./routes/webhook");
const withdrawRoutes = require("./routes/withdraw");

const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(express.json());


app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "One Bet One Click Wallet API Running 🚀"
    });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/customer", customerRoutes);

app.use("/api/withdraw", withdrawRoutes);

app.use("/api/dedicated-account", dedicatedAccountRoutes);

app.use("/api/webhook", webhookRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({

        success: false,

        message: err.message || "Internal Server Error"

    });

});

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});
