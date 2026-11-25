// Tells the login page what is switched on.
import { json } from "../../_lib/auth.js";
export const onRequestGet = ({ env }) => json({ ready: !!env.DB, google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), reset: !!env.RESEND_API_KEY });
