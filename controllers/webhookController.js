const crypto = require("crypto");

const supabase = require("../config/supabase");

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
        | Only Process Successful Charges
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
