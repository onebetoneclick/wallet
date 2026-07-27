const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| Send OTP
|--------------------------------------------------------------------------
*/

exports.sendOTP = async (req, res) => {
    try {
        const { type, email, phone } = req.body;

        if (!type || !["email", "phone"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "type must be either 'email' or 'phone'."
            });
        }

        if (type === "email" && !email) {
            return res.status(400).json({
                success: false,
                message: "Email is required for email OTP."
            });
        }

        if (type === "phone" && !phone) {
            return res.status(400).json({
                success: false,
                message: "Phone is required for phone OTP."
            });
        }

        const payload = type === "email" ? { email } : { phone };

        const { error } = await supabase.auth.signInWithOtp(payload);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to send OTP."
        });
    }
};

/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/

exports.verifyOTP = async (req, res) => {
    try {
        const { type, email, phone, token } = req.body;

        if (!type || !["email", "phone"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "type must be either 'email' or 'phone'."
            });
        }

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "token is required."
            });
        }

        if (type === "email" && !email) {
            return res.status(400).json({
                success: false,
                message: "Email is required for email OTP verification."
            });
        }

        if (type === "phone" && !phone) {
            return res.status(400).json({
                success: false,
                message: "Phone is required for phone OTP verification."
            });
        }

        const payload = type === "email"
            ? { email, token, type: "email" }
            : { phone, token, type: "sms" };

        const { data, error } = await supabase.auth.verifyOtp(payload);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
            data
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message || "OTP verification failed."
        });
    }
};