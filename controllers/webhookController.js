const crypto = require("crypto");

const supabase = require("../config/supabase");
const {

    getCustomer,

    createDedicatedAccount

} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| Paystack Webhook
|--------------------------------------------------------------------------
*/

exports.handlePaystackWebhook = async (req, res) => {

    try {

        /*
        |--------------------------------------------------------------------------
        | Verify Signature
        |--------------------------------------------------------------------------
        */

        const signature = req.headers["x-paystack-signature"];

        const hash = crypto
            .createHmac(
                "sha512",
                process.env.PAYSTACK_SECRET_KEY
            )
            .update(req.body)
            .digest("hex");

        if (hash !== signature) {

            return res.status(401).json({
                success: false,
                message: "Invalid webhook signature"
            });

        }

        const event = JSON.parse(req.body.toString());

       /*
|--------------------------------------------------------------------------
| CUSTOMER IDENTIFICATION SUCCESS
|--------------------------------------------------------------------------
*/

if (event.event === "customeridentification.success") {

    console.log("Customer identification completed.");

    const customerCode =
        event.data.customer_code;

    /*
    |--------------------------------------------------------------------------
    | Get Customer Details
    |--------------------------------------------------------------------------
    */

    const customer =
        await getCustomer(customerCode);

    console.log(customer);

    /*
    |--------------------------------------------------------------------------
    | Create Dedicated Account
    |--------------------------------------------------------------------------
    */

    const dedicated =
        await createDedicatedAccount(customerCode);

    console.log(dedicated);

    /*
    |--------------------------------------------------------------------------
    | Find Wallet
    |--------------------------------------------------------------------------
    */

    const {

        data: wallet

    } = await supabase

        .from("wallets")

        .select("*")

        .eq(
            "paystack_customer_code",
            customerCode
        )

        .maybeSingle();

    if (wallet) {

        await supabase

            .from("wallets")

            .update({

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

            .eq("id", wallet.id);

    }

    await supabase

    .from("profiles")

    .update({

        wallet_activated: true,

        wallet_verified_at:
            new Date().toISOString(),

        updated_at:
            new Date().toISOString()

    })

    .eq("user_id", wallet.user_id);

    return res.status(200).json({

    success: true,

    message:
        "Customer identification processed.",

    data: {

        account_number:
            dedicated.account_number,

        account_name:
            dedicated.account_name,

        bank_name:
            dedicated.bank.name,

        status:
            "active"

    }

});
    
}
/*
|--------------------------------------------------------------------------
| ONLY PROCESS SUCCESSFUL CHARGES
|--------------------------------------------------------------------------
*/

if (event.event !== "charge.success") {

    return res.status(200).json({

        success: true,

        message: "Event ignored"

    });

}

        const payment = event.data;

        const reference = payment.reference;

        const amount = payment.amount / 100;

        const customerCode =
            payment.customer.customer_code;

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Processing
        |--------------------------------------------------------------------------
        */

        const { data: existing } = await supabase

            .from("wallet_transactions")

            .select("id")

            .eq("reference", reference)

            .maybeSingle();

        if (existing) {

            return res.status(200).json({
                success: true,
                message: "Already processed"
            });

        }

        /*
        |--------------------------------------------------------------------------
        | Find Wallet
        |--------------------------------------------------------------------------
        */

        const { data: wallet, error: walletError } =
            await supabase

                .from("wallets")

                .select("*")

                .eq(
                    "paystack_customer_code",
                    customerCode
                )

                .single();

        if (walletError || !wallet) {

            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });

        }

        /*
        |--------------------------------------------------------------------------
        | Credit Wallet
        |--------------------------------------------------------------------------
        */

        const newBalance =
            Number(wallet.balance) + Number(amount);

        const { error: updateError } =
            await supabase

                .from("wallets")

                .update({

                    balance: newBalance

                })

                .eq("id", wallet.id);

        if (updateError) {

            throw updateError;

        }

        /*
        |--------------------------------------------------------------------------
        | Save Transaction
        |--------------------------------------------------------------------------
        */

        const { error: transactionError } =
            await supabase

                .from("wallet_transactions")

                .insert({

                    wallet_id: wallet.id,

                    reference: reference,

                    paystack_reference: reference,

                    paystack_customer_code:
                        customerCode,

                    type: "deposit",

                    amount: amount,

                    status: "success",

                    gateway_response:
                        payment.gateway_response,

                    description:
                        "Wallet funding"

                });

        if (transactionError) {

            throw transactionError;

        }

        return res.status(200).json({

            success: true,

            message: "Wallet credited successfully"

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
