const supabase = require("../config/supabase");

const {

    verifyAccount,
    createCustomer,
    identifyCustomer,
    createDedicatedAccount,
    getDedicatedAccount

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

    }

    catch (err) {

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
| Verify User
|--------------------------------------------------------------------------
| POST /api/wallet/verify-user
|--------------------------------------------------------------------------
*/

exports.verifyUser = async (req, res) => {

    try {

        const {

            email,
            phone,
            bvn,
            bank_code,
            account_number

        } = req.body;

        if (

            !email ||
            !phone ||
            !bvn ||
            !bank_code ||
            !account_number

        ) {

            return res.status(400).json({

                success: false,

                message: "All fields are required."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Verify Bank Account
        |--------------------------------------------------------------------------
        */

        const account = await verifyAccount(

            account_number,
            bank_code

        );

        /*
        |--------------------------------------------------------------------------
        | Check User
        |--------------------------------------------------------------------------
        */

        const {

            data: profile,
            error

        } = await supabase

            .from("profiles")

            .select("*")

            .eq("email", email)

            .maybeSingle();

        if (error) {

            throw error;

        }

        /*
        |--------------------------------------------------------------------------
        | New User
        |--------------------------------------------------------------------------
        */

        if (!profile) {

            return res.status(200).json({

                success: true,

                message: "New user.",

                data: {

                    account_name: account.account_name,

                    needs_otp: true,

                    has_virtual_account: false,

                    is_new_user: true

                }

            });

        }
                /*
        |--------------------------------------------------------------------------
        | Existing Wallet
        |--------------------------------------------------------------------------
        */

        if (

            profile.account_number &&
            profile.paystack_customer_code

        ) {

            let dedicated = null;

            try {

                dedicated = await getDedicatedAccount(

                    profile.paystack_customer_code

                );

            } catch (err) {

                console.log(
                    "Could not fetch dedicated account from Paystack."
                );

            }

            return res.status(200).json({

                success: true,

                message: "Virtual account already exists.",

                data: {

                    has_virtual_account: true,

                    needs_otp: false,

                    customer_code:
                        profile.paystack_customer_code,

                    account_number:
                        profile.account_number,

                    account_name:
                        profile.account_name,

                    bank_name:
                        profile.bank_name,

                    paystack_data:
                        dedicated

                }

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Existing User Without Wallet
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
                "User verified successfully.",

            data: {

                user_id:
                    profile.user_id,

                email:
                    profile.email,

                account_name:
                    account.account_name,

                has_virtual_account: false,

                needs_otp: true

            }

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message:

                err.response?.data?.message ||

                err.message ||

                "Verification failed."

        });

    }

};

/*
|--------------------------------------------------------------------------
| Send Wallet Activation OTP
|--------------------------------------------------------------------------
| User email has already been verified during signup.
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

            message:
                "Wallet activation OTP sent."

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

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

    }

    catch (err) {

        console.error(err);

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

        const {

    data: profile,
    error: profileError

} = await supabase

    .from("profiles")

    .select("*")

    .eq("user_id", user_id)

    .maybeSingle();

if (profileError) {

    throw profileError;

}
        /*
        |--------------------------------------------------------------------------
        | Already Has Wallet
        |--------------------------------------------------------------------------
        */

        if (

    profile &&
    profile.account_number &&
    profile.paystack_customer_code

) {

            return res.status(200).json({

                success: true,

                message: "Wallet already activated.",

                data: {

                    customer_code:
                        profile.paystack_customer_code,

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
        | Identify Customer
        |--------------------------------------------------------------------------
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
        |--------------------------------------------------------------------------
        | Generate Dedicated Account
        |--------------------------------------------------------------------------
        */

        const dedicated = await createDedicatedAccount(

            customer.customer_code

        );

        /*
        |--------------------------------------------------------------------------
        | Save To Supabase
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

    }

    catch (err) {

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
