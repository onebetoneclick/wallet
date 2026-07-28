require("dotenv").config();

const axios = require("axios");

/*
|--------------------------------------------------------------------------
| Paystack Configuration
|--------------------------------------------------------------------------
*/

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is missing in .env");
}

const paystack = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
    }
});

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
*/

async function createCustomer(data) {
    const response = await paystack.post("/customer", {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone
    });

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Identify Customer
|--------------------------------------------------------------------------
*/

async function identifyCustomer(customerCode, data) {
    const response = await paystack.post(
        `/customer/${customerCode}/identification`,
        {
            country: "NG",
            type: "bank_account",
            value: data.bvn,
            account_number: data.account_number,
            bvn: data.bvn,
            bank_code: data.bank_code,
            first_name: data.first_name,
            last_name: data.last_name,
            middle_name: data.middle_name || ""
        }
    );

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Create Dedicated Account (NUBAN)
|--------------------------------------------------------------------------
*/

async function createDedicatedAccount(customerCode) {
    try {
        const response = await paystack.post("/dedicated_account", {
            customer: customerCode,
            preferred_bank: "wema-bank"
        });

        return response.data.data;
    } catch (error) {
        console.error("PAYSTACK DEDICATED ACCOUNT ERROR:");
        console.error(error.response?.data);
        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| Verify Bank Account
|--------------------------------------------------------------------------
*/

async function verifyAccount(accountNumber, bankCode) {
    const response = await paystack.get(
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| List Banks
|--------------------------------------------------------------------------
*/

async function getBanks() {
    const response = await paystack.get("/bank");

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Create Transfer Recipient
|--------------------------------------------------------------------------
*/

async function createTransferRecipient(data) {
    const response = await paystack.post("/transferrecipient", {
        type: "nuban",
        name: data.name,
        account_number: data.account_number,
        bank_code: data.bank_code,
        currency: "NGN"
    });

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Initiate Transfer
|--------------------------------------------------------------------------
*/

async function initiateTransfer(data) {
    const response = await paystack.post("/transfer", {
        source: "balance",
        amount: data.amount, // Kobo
        recipient: data.recipient_code,
        reason: data.reason
    });

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Verify Transaction
|--------------------------------------------------------------------------
*/

async function verifyTransaction(reference) {
    const response = await paystack.get(
        `/transaction/verify/${reference}`
    );

    return response.data.data;
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    createCustomer,
    identifyCustomer,
    createDedicatedAccount,
    verifyAccount,
    getBanks,
    createTransferRecipient,
    initiateTransfer,
    verifyTransaction
};
/*
|--------------------------------------------------------------------------
| Get Dedicated Virtual Account
|--------------------------------------------------------------------------
*/

exports.getDedicatedAccount = async (customer_code) => {

    try {

        const response = await axios.get(

            "https://api.paystack.co/dedicated_account",

            {

                headers: {

                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`

                }

            }

        );

        const accounts = response.data.data;

        const account = accounts.find(

            (item) => item.customer.customer_code === customer_code

        );

        if (!account) {

            return null;

        }

        return account;

    }

    catch (err) {

        throw err;

    }

};
