const { getBanks } = require("../services/paystack");

exports.getBanks = async (req, res) => {

    try {

        const banks = await getBanks();

        return res.status(200).json({

            success: true,

            data: banks

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
