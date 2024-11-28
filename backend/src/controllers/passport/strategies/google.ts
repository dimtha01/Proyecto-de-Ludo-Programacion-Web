import { Profile } from "passport";
import { ROUTES } from "../../../utils/constants";
import CONFIG from "../../../config";
import GoogleStrategy from "passport-google-oauth2";
import type { CallbackAuth, DoneFunction } from "../../../interfaces";

const callbackURL = `${ROUTES.BASE_API}/auth/google/callback`;
const isEnabled = !!(CONFIG.GOOGLE.KEY && CONFIG.GOOGLE.SECRET);

/**
 * Objeto de configuración para la estrategía de github
 */
export default {
  isEnabled,
  callbackURL,
  routerURL: `${ROUTES.BASE_API}/auth/google`,
  socialName: "google",
  socialType: 2,
  fileds: {
    name: "displayName",
    photo: "photos[0].value",
    token: "id",
    email: "email",
  },
  scope: { scope: ["profile", "email"] },
  auth(cb: CallbackAuth) {
    return new GoogleStrategy.Strategy(
      {
        clientID: CONFIG.GOOGLE.KEY,
        clientSecret: CONFIG.GOOGLE.SECRET,
        callbackURL,
      },
      (_: string, _2: string, profile: Profile, done: DoneFunction) => {
        cb({ profile, done });
      }
    );
  },
};
