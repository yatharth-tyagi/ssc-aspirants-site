// Which admin is logged in (the middleware already checked it).
import { json, publicAdmin } from "../../_lib/auth.js";
export const onRequestGet = ({ env, data }) => json({ admin: publicAdmin(env, data.admin) });
