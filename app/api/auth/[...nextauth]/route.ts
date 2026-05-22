/**
 * NextAuth route handler — the GET + POST entry points required for
 * /api/auth/* (sign-in, callback, session, signout).
 *
 * Auth.js v5 exports `handlers` (an object of { GET, POST }). We
 * re-export each method so Next.js's route file convention picks them up.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
