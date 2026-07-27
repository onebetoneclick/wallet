const supabase = require("../config/supabase");

const {
    createCustomer,
    identifyCustomer,
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
                message: "user_id, email, first_name, last_name, phone, bvn, account_number and bank_code are required."
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

        console.log("PAYSTACK CUSTOMER:", customer);

        /*
        |--------------------------------------------------------------------------
        | Identify Customer
        |--------------------------------------------------------------------------
        */

        await identifyCustomer(customer.customer_code, {
            account_number,
            bvn,
            bank_code,
            first_name,
            last_name
        });

        /*
        |--------------------------------------------------------------------------
        | Create Dedicated NUBAN
        |--------------------------------------------------------------------------
        */

        const dedicated = await createDedicatedAccount(customer.customer_code);

        /*
        |--------------------------------------------------------------------------
        | Save to Supabase
        |--------------------------------------------------------------------------
        */

        const { error } = await supabase
            .from("wallets")
            .upsert({
                user_id,
                paystack_customer_code: customer.customer_code,
                account_number: dedicated.account_number,
                account_name: dedicated.account_name,
                bank_name: dedicated.bank.name,
                balance: 0,
                currency: "NGN",
                status: "active"
            }, { onConflict: "user_id" });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "Dedicated account created successfully.",
            data: {
                customer_code: customer.customer_code,
                account_number: dedicated.account_number,
                account_name: dedicated.account_name,
                bank_name: dedicated.bank.name
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
            .from("wallets")
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
            message: err.message
        });
    }
};