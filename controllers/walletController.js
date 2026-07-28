const supabase = require("../config/supabase");

const {
    verifyAccount,
    createCustomer,
    identifyCustomer,
    createDedicatedAccount
} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| Verify Bank Account
|--------------------------------------------------------------------------
| POST /api/wallet/check-account
|--------------------------------------------------------------------------
*/

exports.checkAccount = async (req, res) => {

    try {

        const {

            account_number,
            bank_code

        } = req.body;

        if (!account_number || !bank_code) {

            return res.status(400).json({

                success: false,

                message: "Account number and bank code are required."

            });

        }

        const account = await verifyAccount(

            account_number,
            bank_code

        );

        return res.status(200).json({

            success: true,

            message: "Account verified successfully.",

            data: account

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message:
                err.response?.data?.message ||
                err.message

        });

    }

};

/*
|--------------------------------------------------------------------------
| Send Wallet Activation OTP
|--------------------------------------------------------------------------
| User email has already been verified during signup.
| Send another OTP before wallet activation.
|--------------------------------------------------------------------------
*/

exports.sendActivationOTP = async (req, res) => {

    try {

        const {

            email

        } = req.body;

        if (!email) {

            return res.status(400).json({

                success: false,

                message: "Email is required."

            });

        }

        const {

            error

        } = await supabase.auth.signInWithOtp({

            email

        });

        if (error) {

            throw error;

        }

        return res.status(200).json({

            success: true,

            message: "Wallet activation OTP sent."

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};

/*
|--------------------------------------------------------------------------
| Verify Wallet Activation OTP
|--------------------------------------------------------------------------
*/

exports.verifyActivationOTP = async (req, res) => {

    try {

        const {

            email,
            token

        } = req.body;

        if (!email || !token) {

            return res.status(400).json({

                success: false,

                message: "Email and OTP are required."

            });

        }

        const {

            data,
            error

        } = await supabase.auth.verifyOtp({

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

            message:
                err.message

        });

    }

};
