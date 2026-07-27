const supabase = require("../config/supabase");

const {
    createCustomer,
    createDedicatedAccount
} = require("../services/paystack");

/*
|--------------------------------------------------------------------------
| Register Customer
|--------------------------------------------------------------------------
*/

exports.registerCustomer = async (req, res) => {

    try {

        const {

            user_id,
            email,
            first_name,
            last_name,
            phone

        } = req.body;

        // Validate input

        if (
            !user_id ||
            !email ||
            !first_name ||
            !last_name ||
            !phone
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required."
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
        | Create Dedicated NUBAN
        |--------------------------------------------------------------------------
        */

        const dedicated = await createDedicatedAccount(

            customer.customer_code

        );

        /*
        |--------------------------------------------------------------------------
        | Save to Supabase
        |--------------------------------------------------------------------------
        */

        const { error } = await supabase

            .from("profiles")

            .update({

                paystack_customer_code:
                    customer.customer_code,

                account_number:
                    dedicated.account_number,

                account_name:
                    dedicated.account_name,

                bank_name:
                    dedicated.bank.name

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

            message:
                "Dedicated account created successfully.",

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
                "Something went wrong."

        });

    }

};

/*
|--------------------------------------------------------------------------
| Get Customer
|--------------------------------------------------------------------------
*/

exports.getCustomer = async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase

            .from("profiles")

            .select("*")

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

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};
