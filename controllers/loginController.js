const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

exports.login = async (req, res) => {

    try {

        const { email } = req.body;

console.log("================================");
console.log("EMAIL RECEIVED:", email);
console.log("TYPE:", typeof email);
console.log("================================");

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
| Find Profile
|--------------------------------------------------------------------------
*/

const cleanEmail = email.trim().toLowerCase();

console.log("EMAIL RECEIVED:", cleanEmail);

const {

    data: profile,

    error: profileError

} = await supabase

    .from("profiles")

    .select("*")

    .ilike("email", cleanEmail)

    .maybeSingle();

console.log("PROFILE:", profile);

console.log("PROFILE ERROR:", profileError);

if (profileError) {

    throw profileError;

}

if (!profile) {

    return res.status(404).json({

        success: false,

        message: "No account found with this email."

    });

}

        /*
        |--------------------------------------------------------------------------
        | Send OTP
        |--------------------------------------------------------------------------
        */

        const {

            error: otpError

        } = await supabase.auth.signInWithOtp({

            email

        });

        if (otpError) throw otpError;

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message: "OTP sent successfully."

        });

    }

    catch (err) {

        console.error(

            "LOGIN ERROR:",

            err

        );

        return res.status(500).json({

            success: false,

            message:

                err.message ||

                "Unable to login."

        });

    }

};
