const supabase = require("../config/supabase");

const {
    verifyAccount,
    createTransferRecipient,
    initiateTransfer
} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| Withdraw Funds
|--------------------------------------------------------------------------
*/

exports.withdraw = async (req, res) => {

    try {

        const {

            user_id,

            account_number,

            bank_code,

            amount,

            reason

        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (
            !user_id ||
            !account_number ||
            !bank_code ||
            !amount
        ) {

            return res.status(400).json({

                success: false,

                message: "Missing required fields."

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

            .eq("user_id", user_id)

            .single();

        if (walletError || !wallet) {

            return res.status(404).json({

                success: false,

                message: "Wallet not found."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Check Wallet Balance
        |--------------------------------------------------------------------------
        */

        if (Number(wallet.balance) < Number(amount)) {

            return res.status(400).json({

                success: false,

                message: "Insufficient wallet balance."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Verify Account
        |--------------------------------------------------------------------------
        */

        const account = await verifyAccount(

            account_number,

            bank_code

        );

        /*
        |--------------------------------------------------------------------------
        | Create Recipient
        |--------------------------------------------------------------------------
        */

        const recipient = await createTransferRecipient({

            name: account.account_name,

            account_number,

            bank_code

        });

        /*
        |--------------------------------------------------------------------------
        | Initiate Transfer
        |--------------------------------------------------------------------------
        */

        const transfer = await initiateTransfer({

            amount: Number(amount) * 100,

            recipient_code: recipient.recipient_code,

            reason: reason || "Wallet Withdrawal"

        });

        /*
        |--------------------------------------------------------------------------
        | Update Wallet Balance
        |--------------------------------------------------------------------------
        */

        const newBalance =

            Number(wallet.balance) -

            Number(amount);

        const {

            error: updateError

        } = await supabase

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

        const {

            error: transactionError

        } = await supabase

            .from("wallet_transactions")

            .insert({

                wallet_id: wallet.id,

                reference: transfer.reference,

                paystack_reference: transfer.reference,

                paystack_customer_code:
                    wallet.paystack_customer_code,

                type: "withdrawal",

                amount: amount,

                status: "pending",

                gateway_response: "Transfer Initiated",

                description:
                    reason || "Wallet Withdrawal"

            });

        if (transactionError) {

            throw transactionError;

        }

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message: "Withdrawal initiated successfully.",

            data: {

                reference: transfer.reference,

                transfer_code: transfer.transfer_code,

                status: transfer.status,

                new_balance: newBalance

            }

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message:
                err.response?.data?.message ||
                err.message ||
                "Withdrawal failed."

        });

    }

};
