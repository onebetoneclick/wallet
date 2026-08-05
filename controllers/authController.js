const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function splitFullName(fullName = "") {

    const names = fullName
        .trim()
        .replace(/\s+/g, " ")
        .split(" ");

    return {

        first_name: names[0] || "",

        last_name: names.slice(1).join(" ")

    };

}

/*
|--------------------------------------------------------------------------
| REGISTER USER
|--------------------------------------------------------------------------
*/

exports.registerUser = async (req, res) => {

    try {

        const {

            email,
            phone,
            full_name,
            account_number,
            bank_code

        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | Validate
        |--------------------------------------------------------------------------
        */

        if (

            !email ||

            !phone ||

            !full_name ||

            !account_number ||

            !bank_code

        ) {

            return res.status(400).json({

                success: false,

                message:
                "Email, phone, full name, bank code and account number are required."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Split Name
        |--------------------------------------------------------------------------
        */

        const {

            first_name,

            last_name

        } = splitFullName(full_name);

        /*
        |--------------------------------------------------------------------------
        | Check Existing Email
        |--------------------------------------------------------------------------
        */

        const {

            data: existingEmail,

            error: emailError

        } = await supabase

            .from("profiles")

            .select("id,email")

            .eq("email", email)

            .maybeSingle();

        if (emailError) throw emailError;

        if (existingEmail) {

            return res.status(409).json({

                success: false,

                message:
                "Email already exists."

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Check Existing Phone
        |--------------------------------------------------------------------------
        */

        const {

            data: existingPhone,

            error: phoneError

        } = await supabase

            .from("profiles")

            .select("id,phone")

            .eq("phone", phone)

            .maybeSingle();

        if (phoneError) throw phoneError;

        if (existingPhone) {

            return res.status(409).json({

                success: false,

                message:
                "Phone number already exists."

            });

        }
              /*
        |--------------------------------------------------------------------------
        | Create Supabase Auth User
        |--------------------------------------------------------------------------
        */

        const {

            data: authUser,

            error: authError

        } = await supabase.auth.admin.createUser({

            email,

            email_confirm: false,

            user_metadata: {

                full_name,

                first_name,

                last_name,

                phone

            }

        });

        if (authError) throw authError;

        /*
        |--------------------------------------------------------------------------
        | User ID
        |--------------------------------------------------------------------------
        */

        const user_id = authUser.user.id;

       /*
|--------------------------------------------------------------------------
| Update Existing Profile Created By Trigger
|--------------------------------------------------------------------------
*/

const {

    error: profileError

} = await supabase

    .from("profiles")

    .update({

        email,

        phone,

        first_name,

        last_name,

        full_name,

        account_number,

        bank_code,

        wallet_activated: false,

        updated_at: new Date().toISOString()

    })

    .eq("user_id", user_id);

if (profileError) throw profileError;

        /*
        |--------------------------------------------------------------------------
        | Send Email OTP
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

            message:
                "Registration successful. OTP has been sent to your email.",

            data: {

                user_id,

                email,

                phone,

                full_name,

                first_name,

                last_name,

                account_number,

                bank_code,

                wallet_activated: false

            }

        });

    }

    catch (err) {

        console.error(

            "REGISTER USER ERROR:",

            err

        );

        return res.status(500).json({

            success: false,

            message:

                err.message ||

                "Registration failed."

        });

    }

};
/*
|--------------------------------------------------------------------------
| VERIFY EMAIL OTP
|--------------------------------------------------------------------------
*/

exports.verifyEmail = async (req, res) => {

    try {

        const {

            email,

            token

        } = req.body;

        if (!email || !token) {

            return res.status(400).json({

                success: false,

                message: "Email and OTP are required."

            });

        }

        const {

            data,

            error

        } = await supabase.auth.verifyOtp({

            email,

            token,

            type: "email"

        });

        if (error) throw error;

        return res.status(200).json({

            success: true,

            message: "Email verified successfully.",

            data

        });

    }

    catch (err) {

        console.error(

            "VERIFY EMAIL ERROR:",

            err

        );

        return res.status(500).json({

            success: false,

            message:

                err.message ||

                "Unable to verify email."

        });

    }

};

/*
|--------------------------------------------------------------------------
| RESEND EMAIL OTP
|--------------------------------------------------------------------------
*/

exports.resendOTP = async (req, res) => {

    try {

        const {

            email

        } = req.body;

        if (!email) {

            return res.status(400).json({

                success: false,

                message: "Email is required."

            });

        }

        const {

            error

        } = await supabase.auth.signInWithOtp({

            email

        });

        if (error) throw error;

        return res.status(200).json({

            success: true,

            message: "OTP has been sent successfully."

        });

    }

    catch (err) {

        console.error(

            "RESEND OTP ERROR:",

            err

        );

        return res.status(500).json({

            success: false,

            message:

                err.message ||

                "Unable to resend OTP."

        });

    }

};

/*
|--------------------------------------------------------------------------
| LOGIN USER
|--------------------------------------------------------------------------
*/

exports.loginUser = async (req, res) => {

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


        const cleanEmail = email.trim().toLowerCase();


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
                wallet_activated,
                account_number,
                account_name,
                bank_name,
                bank_code

            `)

            .ilike("email", cleanEmail)

            .maybeSingle();


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
        | Check Wallet Status
        |--------------------------------------------------------------------------
        */

        if (!profile.wallet_activated) {

            return res.status(400).json({

                success: false,

                message:
                "Your wallet is not activated yet."

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

            email: cleanEmail

        });


        if (otpError) {

            throw otpError;

        }


        /*
        |--------------------------------------------------------------------------
        | Save Temporary Login Data
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
            "Login OTP sent successfully.",

            data: {

                email: profile.email,

                user_id: profile.user_id,

                full_name: profile.full_name

            }

        });


    }


    catch (err) {


        console.error(

            "LOGIN USER ERROR:",

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

/*
|--------------------------------------------------------------------------
| VERIFY LOGIN OTP
|--------------------------------------------------------------------------
*/

exports.verifyLoginOTP = async (req, res) => {

    try {

        const {

            email,

            token

        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | Validate
        |--------------------------------------------------------------------------
        */

        if (!email || !token) {

            return res.status(400).json({

                success: false,

                message:
                "Email and OTP are required."

            });

        }


        const cleanEmail = email.trim().toLowerCase();


        /*
        |--------------------------------------------------------------------------
        | Verify OTP
        |--------------------------------------------------------------------------
        */

        const {

            data,

            error

        } = await supabase.auth.verifyOtp({

            email: cleanEmail,

            token,

            type: "email"

        });


        if (error) {

            throw error;

        }
        console.log("OTP VERIFIED USER:");
        console.log(data.user);


        /*
        |--------------------------------------------------------------------------
        | Get User Profile After Login
        |--------------------------------------------------------------------------
        */
const emailFromOTP = data.user.email;

console.log("EMAIL FROM OTP:");
console.log(emailFromOTP);

const {

    data: profile,

    error: profileError

} = await supabase

    .from("profiles")

    .select("*")

    .eq("email", emailFromOTP)

    .maybeSingle();

console.log("PROFILE:");
console.log(profile);

console.log("PROFILE ERROR:");
console.log(profileError);


        if (profileError) {

            throw profileError;

        }



        if (!profile) {

            return res.status(404).json({

                success: false,

                message:
                "User profile not found after verification."

            });

        }



        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            message:
            "Login successful.",

            session: data.session,

            user: {

                user_id: profile.user_id,

                email: profile.email,

                phone: profile.phone,

                full_name: profile.full_name,

                first_name: profile.first_name,

                last_name: profile.last_name,

                account_number: profile.account_number,

                account_name: profile.account_name,

                bank_name: profile.bank_name,

                bank_code: profile.bank_code,

                wallet_activated:
                profile.wallet_activated

            }

        });


    }


    catch (err) {


        console.error(

            "VERIFY LOGIN OTP ERROR:",

            err

        );


        return res.status(500).json({

            success: false,

            message:

            err.message ||

            "Unable to verify login OTP."

        });


    }

};

/*
|--------------------------------------------------------------------------
| END OF AUTH CONTROLLER
|--------------------------------------------------------------------------
*/
exports.testProfile = async (req, res) => {

    try {

        const { email } = req.body;

        const {

            data,

            error

        } = await supabase

            .from("profiles")

            .select("*")

            .eq("email", email)

            .maybeSingle();

        if (error) throw error;

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
