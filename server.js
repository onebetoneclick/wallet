require("dotenv").config();

const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer");
const dedicatedAccountRoutes = require("./routes/dedicatedAccount");
const webhookRoutes = require("./routes/webhook");
const withdrawRoutes = require("./routes/withdraw");
const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const app = express();

app.use(cors());

app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use("/api/webhook", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "One Bet One Click Wallet API Running 🚀"
  });
});

app.use("/api/customer", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/dedicated-account", dedicatedAccountRoutes);
app.use("/api/wallet", walletRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
