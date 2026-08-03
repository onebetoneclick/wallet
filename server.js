require("dotenv").config();

const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer");
const dedicatedAccountRoutes = require("./routes/dedicatedAccount");
const webhookRoutes = require("./routes/webhook");
const withdrawRoutes = require("./routes/withdraw");
const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const bankRoutes = require("./routes/bank"); // NEW

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
| Webhook
|--------------------------------------------------------------------------
*/

app.use(
    "/api/webhook",
    express.raw({ type: "application/json" })
);

app.use("/api/webhook", webhookRoutes);

/*
|--------------------------------------------------------------------------
| Home Route
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

app.use("/api/auth", authRoutes);

app.use("/api/withdraw", withdrawRoutes);

app.use("/api/dedicated-account", dedicatedAccountRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/bank", bankRoutes); // NEW

/*
|--------------------------------------------------------------------------
| 404 Route
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
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`🚀 Server running on port ${PORT}`);

});
