const supabase = require("../config/supabase");

const {
    createDedicatedAccount
} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| Create Dedicated Account
|--------------------------------------------------------------------------
*/

exports.createDedicatedAccount = async (req, res) => {

    try {

        const { user_id, customer_code } = req.body;

        if (!user_id || !customer_code) {

            return res.status(400).json({
                success: false,
                message: "user_id and customer_code are required."
            });

        }

        /*
        |--------------------------------------------------------------------------
        | Generate Dedicated NUBAN
        |--------------------------------------------------------------------------
        */

        const dedicated = await createDedicatedAccount(customer_code);

        /*
        |--------------------------------------------------------------------------
        | Save Account Details
        |--------------------------------------------------------------------------
        */

        const { error } = await supabase

            .from("profiles")

            .update({

                account_number: dedicated.account_number,

                account_name: dedicated.account_name,

                bank_name: dedicated.bank.name

            })

            .eq("user_id", user_id);

        if (error) {

            throw error;

        }

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message: "Dedicated account created successfully.",

            data: {

                account_number: dedicated.account_number,

                account_name: dedicated.account_name,

                bank_name: dedicated.bank.name,

                customer: customer_code

            }

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message:
                err.response?.data?.message ||
                err.message ||
                "Unable to create dedicated account."

        });

    }

};

/*
|--------------------------------------------------------------------------
| Get Dedicated Account
|--------------------------------------------------------------------------
*/

exports.getDedicatedAccount = async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase

            .from("profiles")

            .select("account_number, account_name, bank_name")

            .eq("user_id", id)

            .single();

        if (error) {

            throw error;

        }

        return res.status(200).json({

            success: true,

            data

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
