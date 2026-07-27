const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| Send OTP
|--------------------------------------------------------------------------
*/

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false
            }
        });

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
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: "Email and token are required."
            });
        }

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email"
        });

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
