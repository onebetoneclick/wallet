require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

/*
|--------------------------------------------------------------------------
| Environment Variables
|--------------------------------------------------------------------------
*/

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

if (!SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing in .env");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is missing in .env"
    );
}

/*
|--------------------------------------------------------------------------
| Create Supabase Client
|--------------------------------------------------------------------------
*/

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = supabase;
