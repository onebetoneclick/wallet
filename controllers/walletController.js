const supabase = require("../config/supabase");

const {
    verifyAccount,
    createCustomer,
    identifyCustomer,
    getCustomer,
    createDedicatedAccount,
    getDedicatedAccount,
    initializeTransaction
} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| VERIFY BANK ACCOUNT
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
| VERIFY USER
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
        | Verify Account Number
        |--------------------------------------------------------------------------
        */

        const account = await verifyAccount(
            account_number,
            bank_code
        );

        /*
        |--------------------------------------------------------------------------
        | Find Profile
        |--------------------------------------------------------------------------
        */

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (profileError) throw profileError;

        /*
        |--------------------------------------------------------------------------
        | Brand New User
        |--------------------------------------------------------------------------
        */

        if (!profile) {

            return res.status(200).json({

                success: true,

                message: "New user.",

                data: {

                    account_name: account.account_name,

                    is_new_user: true,

                    needs_otp: true,

                    has_virtual_account: false

                }

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Check Wallet Table
        |--------------------------------------------------------------------------
        */

        const {
            data: wallet,
            error: walletError
        } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", profile.user_id)
            .maybeSingle();

        if (walletError) throw walletError;

        /*
        |--------------------------------------------------------------------------
        | Existing Wallet
        |--------------------------------------------------------------------------
        */

        if (
            wallet &&
            wallet.paystack_customer_code
        ) {

            let dedicated = null;

            try {

                dedicated = await getDedicatedAccount(
                    wallet.paystack_customer_code
                );

            } catch (err) {

                console.log("Could not fetch Paystack DVA.");

            }

            return res.status(200).json({

                success: true,

                message: "Wallet already exists.",

                data: {

                    user_id: profile.user_id,

                    has_virtual_account: true,

                    needs_otp: false,

                    customer_code:
                        wallet.paystack_customer_code,

                    account_number:
                        wallet.account_number,

                    account_name:
                        wallet.account_name,

                    bank_name:
                        wallet.bank_name,

                    balance:
                        wallet.balance,

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

            message: "User verified successfully.",

            data: {

                user_id: profile.user_id,

                email: profile.email,

                first_name: profile.first_name,

                last_name: profile.last_name,

                phone: profile.phone,

                account_name: account.account_name,

                has_virtual_account: false,

                needs_otp: true

            }

        });

    } catch (err) {

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
| SEND ACTIVATION OTP
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

            message: "Wallet activation OTP sent successfully."

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
| VERIFY ACTIVATION OTP
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

        if (error) throw error;

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
| ACTIVATE WALLET
|--------------------------------------------------------------------------
| Part 3 starts here...
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
        | Validate Request
        |--------------------------------------------------------------------------
        */

        if (

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

                message:
                    "email, first_name, last_name, phone, bvn, account_number and bank_code are required."

            });

        }

       /*
|--------------------------------------------------------------------------
| Find User Profile
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

        if (profileError) throw profileError;

        if (!profile) {

            return res.status(404).json({

                success: false,

                message: "User profile not found."

            });

        }
        /*
        |--------------------------------------------------------------------------
        | Check Wallet Table
        |--------------------------------------------------------------------------
        */

        const {

            data: wallet,
            error: walletError

        } = await supabase

            .from("wallets")

            .select("*")

            .eq("user_id", user_id)

            .maybeSingle();

        if (walletError) throw walletError;

        console.log("PROFILE USER ID:", user_id);
        console.log("WALLET RECORD:", wallet);

        /*
        |--------------------------------------------------------------------------
        | Continue in Part 3...
        |--------------------------------------------------------------------------
        */
        /*
        |--------------------------------------------------------------------------
        | Existing Wallet In Paystack
        |--------------------------------------------------------------------------
        */

        if (wallet && wallet.paystack_customer_code) {

            const existingAccount = await getDedicatedAccount(
                wallet.paystack_customer_code
            );

            if (existingAccount) {

                await supabase
                    .from("wallets")
                    .update({

                        account_number:
                            existingAccount.account_number,

                        account_name:
                            existingAccount.account_name,

                        bank_name:
                            existingAccount.bank.name,

                        dedicated_account_id:
                            existingAccount.id,

                        status: "active",

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq("user_id", user_id);

                await supabase
                    .from("profiles")
                    .update({

                        wallet_activated: true,

                        wallet_verified_at:
                            new Date().toISOString(),

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq("user_id", user_id);

                return res.status(200).json({

                    success: true,

                    message:
                        "Existing virtual account retrieved successfully.",

                    data: {

                        customer_code:
                            wallet.paystack_customer_code,

                        account_number:
                            existingAccount.account_number,

                        account_name:
                            existingAccount.account_name,

                        bank_name:
                            existingAccount.bank.name

                    }

                });

            }

        }

        /*
        |--------------------------------------------------------------------------
        | Verify Bank Account
        |--------------------------------------------------------------------------
        */

        const verified = await verifyAccount(
            account_number,
            bank_code
        );

        if (!verified) {

            return res.status(400).json({

                success: false,

                message: "Unable to verify account."

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
| CREATE EMPTY WALLET RECORD
|--------------------------------------------------------------------------
*/

if (!wallet) {

    await supabase

        .from("wallets")

        .insert({

            user_id,

            paystack_customer_code:
                customer.customer_code,

            balance: 0,

            currency: "NGN",

            status: "pending"

        });

}
        
/*
|--------------------------------------------------------------------------
| Identify Customer
|--------------------------------------------------------------------------
*/

const identify = await identifyCustomer(

    customer.customer_code,

    {

        account_number,

        bank_code,

        bvn,

        first_name,

        last_name

    }

);

console.log("IDENTIFY SUCCESS:");
console.log(identify);
        
      /*
|--------------------------------------------------------------------------
| Create Dedicated Account
|--------------------------------------------------------------------------
*/

return res.status(200).json({

    success: true,

    pending: true,

    message:
        "Your identity has been submitted to Paystack. Your virtual account will be created automatically after verification.",

    data: {

        customer_code:
            customer.customer_code

    }

});

const dedicated = await createDedicatedAccount(
    customer.customer_code
);

if (!dedicated) {

    return res.status(500).json({

        success: false,

        message:
            "Unable to create dedicated account."

    });

}
        
        /*
        |--------------------------------------------------------------------------
        | Save Wallet
        |--------------------------------------------------------------------------
        */

        if (wallet) {

            await supabase
                .from("wallets")
                .update({

                    paystack_customer_code:
                        customer.customer_code,

                    account_number:
                        dedicated.account_number,

                    account_name:
                        dedicated.account_name,

                    bank_name:
                        dedicated.bank.name,

                    dedicated_account_id:
                        dedicated.id,

                    status: "active",

                    updated_at:
                        new Date().toISOString()

                })
                .eq("user_id", user_id);

        } else {

            await supabase
                .from("wallets")
                .insert({

                    user_id,

                    paystack_customer_code:
                        customer.customer_code,

                    account_number:
                        dedicated.account_number,

                    account_name:
                        dedicated.account_name,

                    bank_name:
                        dedicated.bank.name,

                    dedicated_account_id:
                        dedicated.id,

                    balance: 0,

                    currency: "NGN",

                    status: "active"

                });

        }

        /*
        |--------------------------------------------------------------------------
        | Update Profile
        |--------------------------------------------------------------------------
        */

        await supabase
            .from("profiles")
            .update({

                first_name,

                last_name,

                full_name:
                    `${first_name} ${last_name}`,

                phone,

                bvn,

                wallet_activated: true,

                wallet_verified_at:
                    new Date().toISOString(),

                updated_at:
                    new Date().toISOString()

            })
            .eq("user_id", user_id);

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
                "Wallet activated successfully.",

            data: {

                user_id,

                customer_code:
                    customer.customer_code,

                account_number:
                    dedicated.account_number,

                account_name:
                    dedicated.account_name,

                bank_name:
                    dedicated.bank.name,

                wallet_activated: true

            }

        });

    } catch (err) {

        console.error(
            "ACTIVATE WALLET ERROR:",
            err.response?.data || err
        );

        return res.status(500).json({

            success: false,

            message:
                err.response?.data?.message ||
                err.message ||
                "Wallet activation failed."

        });

    }

};
/*
|--------------------------------------------------------------------------
| GET EXISTING WALLET
|--------------------------------------------------------------------------
| POST /api/wallet/existing-wallet
|--------------------------------------------------------------------------
*/

exports.getExistingWallet = async (req, res) => {

    try {

        const { email } = req.body;
        /*
|--------------------------------------------------------------------------
| DEBUG EMAIL
|--------------------------------------------------------------------------
*/

console.log("EMAIL RECEIVED:");
console.log(email);

        if (!email) {

            return res.status(400).json({

                success: false,

                message: "Email is required."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Find User Profile
        |--------------------------------------------------------------------------
        */

        const {

            data: profile,
            error: profileError

        } = await supabase

            .from("profiles")

            .select("*")

            .eq("email", email)

            .maybeSingle();
        /*
|--------------------------------------------------------------------------
| DEBUG PROFILE
|--------------------------------------------------------------------------
*/

console.log("PROFILE FOUND:");
console.log(profile);

console.log("PROFILE ERROR:");
console.log(profileError);

        if (profileError) throw profileError;

        if (!profile) {

            return res.status(404).json({

                success: false,

                message: "User profile not found."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Find Wallet
        |--------------------------------------------------------------------------
        */

        const {

            data: wallet,
            error: walletError

        } = await supabase

            .from("wallets")

            .select("*")

            .eq("user_id", profile.user_id)

            .maybeSingle();
        /*
|--------------------------------------------------------------------------
| DEBUG WALLET
|--------------------------------------------------------------------------
*/

console.log("WALLET FOUND:");
console.log(wallet);

console.log("WALLET ERROR:");
console.log(walletError);

        if (walletError) throw walletError;

        if (!wallet || !wallet.paystack_customer_code) {

            return res.status(404).json({

                success: false,

                message: "No wallet found for this user."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Get Dedicated Account From Paystack
        |--------------------------------------------------------------------------
        */

        const dedicated = await getDedicatedAccount(
            wallet.paystack_customer_code
        );

        if (!dedicated) {

            return res.status(404).json({

                success: false,

                message: "Dedicated account not found on Paystack."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Update Wallet Record
        |--------------------------------------------------------------------------
        */

        await supabase

            .from("wallets")

            .update({

                account_number: dedicated.account_number,

                account_name: dedicated.account_name,

                bank_name: dedicated.bank.name,

                dedicated_account_id: dedicated.id,

                status: "active",

                updated_at: new Date().toISOString()

            })

            .eq("user_id", profile.user_id);

        /*
        |--------------------------------------------------------------------------
        | Return Wallet
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message: "Existing wallet retrieved successfully.",

           data: {

    user_id: profile.user_id,

    email: profile.email,

    phone: profile.phone,

    full_name: profile.full_name,

    first_name: profile.first_name,

    last_name: profile.last_name,

    customer_code: wallet.paystack_customer_code,

    account_number: dedicated.account_number,

    account_name: dedicated.account_name,

    bank_name: dedicated.bank.name,

    balance: wallet.balance,

    currency: wallet.currency,

    wallet_activated: profile.wallet_activated

}
        });

    }

    catch (err) {

        console.error(

            "GET EXISTING WALLET ERROR:",

            err.response?.data || err

        );

        return res.status(500).json({

            success: false,

            message:

                err.response?.data?.message ||

                err.message ||

                "Unable to retrieve wallet."

        });

    }

};
/*
|--------------------------------------------------------------------------
| GET WALLET STATUS
|--------------------------------------------------------------------------
| POST /api/wallet/status
|--------------------------------------------------------------------------
*/

exports.getWalletStatus = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({

                success: false,

                message: "Email is required."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Find Profile
        |--------------------------------------------------------------------------
        */

        const {

            data: profile,
            error: profileError

        } = await supabase

            .from("profiles")

            .select("*")

            .eq("email", email)

            .single();

        if (profileError) throw profileError;

        /*
        |--------------------------------------------------------------------------
        | Find Wallet
        |--------------------------------------------------------------------------
        */

        const {

            data: wallet,
            error: walletError

        } = await supabase

            .from("wallets")

            .select("*")

            .eq("user_id", profile.user_id)

            .single();

        if (walletError) throw walletError;

        return res.status(200).json({

            success: true,

            data: {

                status: wallet.status,

                account_number: wallet.account_number,

                account_name: wallet.account_name,

                bank_name: wallet.bank_name,

                balance: wallet.balance,

                customer_code: wallet.paystack_customer_code

            }

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
