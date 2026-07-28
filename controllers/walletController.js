const supabase = require("../config/supabase");

const {
    verifyAccount,
    createCustomer,
    identifyCustomer,
    createDedicatedAccount
} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| Check Bank Account
|--------------------------------------------------------------------------
*/

exports.checkAccount = async (req, res) => {

    try {

        const { account_number, bank_code } = req.body;

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

            data: account

        });

    } catch (err) {

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
*/

exports.sendActivationOTP = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Email is required."
            });

        }

        const { error } = await supabase.auth.signInWithOtp({

            email

        });

        if (error) throw error;

        return res.status(200).json({

            success: true,

            message: "OTP sent successfully."

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
|--------------------------------------------------------------------------
| Verify Wallet OTP
|--------------------------------------------------------------------------
*/

exports.verifyActivationOTP = async (req, res) => {

    try {

        const {

            email,
            token

        } = req.body;

        const { data, error } = await supabase.auth.verifyOtp({

            email,

            token,

            type: "email"

        });

        if (error) throw error;

        return res.status(200).json({

            success: true,

            message: "OTP verified.",

            data

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message: err.message

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
        ----------------------------------------------------------
        Check Existing Wallet
        ----------------------------------------------------------
        */

        const { data: profile } = await supabase

            .from("profiles")

            .select("*")

            .eq("user_id", user_id)

            .single();

        if (
            profile &&
            profile.account_number &&
            profile.paystack_customer_code
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Wallet already exists.",

                data: {

                    account_number:
                        profile.account_number,

                    account_name:
                        profile.account_name,

                    bank_name:
                        profile.bank_name

                }

            });

        }

        /*
        ----------------------------------------------------------
        Create Customer
        ----------------------------------------------------------
        */

        const customer = await createCustomer({

            email,

            first_name,

            last_name,

            phone

        });

        /*
        ----------------------------------------------------------
        Identify Customer
        ----------------------------------------------------------
        */

        await identifyCustomer(

            customer.customer_code,

            {

                country: "NG",

                type: "bank_account",

                account_number,

                bank_code,

                bvn,

                first_name,

                last_name

            }

        );

        /*
        ----------------------------------------------------------
        Generate Dedicated Account
        ----------------------------------------------------------
        */

        const dedicated = await createDedicatedAccount(

            customer.customer_code

        );

        /*
        ----------------------------------------------------------
        Save
        ----------------------------------------------------------
        */

        await supabase

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

                wallet_activated: true

            })

            .eq("user_id", user_id);

        return res.status(200).json({

            success: true,

            message:
                "Wallet activated successfully.",

            data: dedicated

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
