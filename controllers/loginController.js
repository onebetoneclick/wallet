const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

exports.login = async (req, res) => {

    try {

        const { email } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validate
        |--------------------------------------------------------------------------
        */

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

            .select(`
                user_id,
                email,
                phone,
                full_name,
                first_name,
                last_name,
                wallet_activated
            `)

            .ilike("email", email.trim())

            .maybeSingle();

        if (profileError) {

            throw profileError;

        }

        if (!profile) {

            return res.status(404).json({

                success: false,

                message: "User profile not found."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Wallet Activated?
        |--------------------------------------------------------------------------
        */

        if (!profile.wallet_activated) {

            return res.status(400).json({

                success: false,

                message: "Please activate your wallet first."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Send Login OTP
        |--------------------------------------------------------------------------
        */

        const {

            error: otpError

        } = await supabase.auth.signInWithOtp({

            email: profile.email

        });

        if (otpError) {

            throw otpError;

        }

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message: "OTP has been sent successfully.",

            data: {

                user_id: profile.user_id,

                email: profile.email,

                phone: profile.phone,

                full_name: profile.full_name,

                first_name: profile.first_name,

                last_name: profile.last_name,

                wallet_activated: profile.wallet_activated

            }

        });

    }

    catch (err) {

        console.error("LOGIN ERROR:", err);

        return res.status(500).json({

            success: false,

            message: err.message || "Unable to login."

        });

    }

};
