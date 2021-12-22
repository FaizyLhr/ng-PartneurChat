let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let mongoose = require("mongoose");
let User = mongoose.model("User");

// const localStrategy = passport.use(
passport.use(
	new LocalStrategy(
		{
			usernameField: "user[email]",
			passwordField: "user[password]",
		},
		function (email, password, done) {
			User.findOne({ email: email })
				.then(function (user) {
					if (!user || !user.validPassword(password)) {
						return done(null, false, {
							errors: { "email or password": "is invalid" },
						});
					}

					return done(null, user);
				})
				.catch(done);
		}
	)
);

// const googleStrategy = passport.use(
passport.use(
	"google",
	new LocalStrategy(
		{
			usernameField: "user[email]",
			passwordField: "user[id]",
		},
		function (email, id, done) {
			User.findOne({ email: email })
				.then(function (user) {
					return done(null, user);
				})
				.catch(done);
		}
	)
);

// module.exports = { localStrategy, googleStrategy };
