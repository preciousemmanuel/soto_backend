import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import envConfig from "./env.config";

passport.serializeUser((gUser, done) => {
	done(null, gUser);
});

passport.deserializeUser((gUser: any, done) => {
	done(null, gUser);
});

passport.use(
	new GoogleStrategy(
		{
			clientID: envConfig.GOOGLE_CLIENT_ID as string,
			clientSecret: envConfig.GOOGLE_CLIENT_SECRET as string,
			callbackURL: `${envConfig.NODE_SERVER_URL}/user/google-callback`,
		},
		(accessToken, refreshToken, profile, done) => {
			const { name, emails, photos } = profile;
			const user = {
				...(emails && { email: emails[0].value }),
				...(name && { firstName: name.givenName }),
				...(name && { lastName: name?.familyName }),
				...(photos && { picture: photos[0].value }),
				accessToken,
			};

			return done(null, user);
		}
	)
);

export default passport;
