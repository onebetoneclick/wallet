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
/*
|--------------------------------------------------------------------------
| Activate Wallet
|--------------------------------------------------------------------------
*/

exports.activateWallet = async (req, res) => {

    try {

        const {

            user_id,
            email,
            first_name,
            last_name,
            phone,
            bvn,
            account_number,
            bank_code

        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validate
        |--------------------------------------------------------------------------
        */

        if (

            !user_id ||
            !email ||
            !first_name ||
            !last_name ||
            !phone ||
            !bvn ||
            !account_number ||
            !bank_code

        ) {

            return res.status(400).json({

                success: false,

                message: "All fields are required."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Check Existing Wallet
        |--------------------------------------------------------------------------
        */

        const {

            data: profile,
            error: profileError

        } = await supabase

            .from("profiles")

            .select("*")

            .eq("user_id", user_id)

            .single();

        if (profileError) {

            throw profileError;

        }

        /*
        |--------------------------------------------------------------------------
        | Existing Dedicated Account
        |--------------------------------------------------------------------------
        */

        if (

            profile.account_number &&
            profile.paystack_customer_code

        ) {

            return res.status(200).json({

                success: true,

                message: "Wallet already activated.",

                data: {

                    account_number:
                        profile.account_number,

                    account_name:
                        profile.account_name,

                    bank_name:
                        profile.bank_name,

                    customer_code:
                        profile.paystack_customer_code

                }

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Create Paystack Customer
        |--------------------------------------------------------------------------
        */

        const customer = await createCustomer({

            email,

            first_name,

            last_name,

            phone

        });
                /*
        |--------------------------------------------------------------------------
        | Identify Customer (BVN + Bank Account)
        |--------------------------------------------------------------------------
        */

        await identifyCustomer(

            customer.customer_code,

            {

                country: "NG",

                type: "bank_account",

                account_number,

                bvn,

                bank_code,

                first_name,

                last_name

            }

        );

        /*
        |--------------------------------------------------------------------------
        | Generate Dedicated Virtual Account
        |--------------------------------------------------------------------------
        */

        const dedicated = await createDedicatedAccount(

            customer.customer_code

        );

        /*
        |--------------------------------------------------------------------------
        | Save Wallet Information
        |--------------------------------------------------------------------------
        */

        const {

            error: updateError

        } = await supabase

            .from("profiles")

            .update({

                paystack_customer_code:
                    customer.customer_code,

                account_number:
                    dedicated.account_number,

                account_name:
                    dedicated.account_name,

                bank_name:
                    dedicated.bank.name,

                bvn,

                wallet_activated: true,

                wallet_verified_at:
                    new Date().toISOString()

            })

            .eq("user_id", user_id);

        if (updateError) {

            throw updateError;

        }

        /*
        |--------------------------------------------------------------------------
        | Success Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
                "Wallet activated successfully.",

            data: {

                customer_code:
                    customer.customer_code,

                account_number:
                    dedicated.account_number,

                account_name:
                    dedicated.account_name,

                bank_name:
                    dedicated.bank.name

            }

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message:
                err.response?.data?.message ||
                err.message ||
                "Wallet activation failed."

        });

    }

};
