const passport = require("passport"),
	LocalStrategy = require("passport-local").Strategy;

const UserModel = require("../models/User");

const localStrategy = new LocalStrategy(
	{ usernameField: "email", passwordField: "password" },
	(email, password, done) => {
		UserModel.findOne({ email }, (err, user) => {
			if (err) {
				return done(err);
			}
			// console.log(user);
			if (!user) {
				return done(null, false, { message: "Incorrect Email Address" });
			}
			// console.log("chk");
			// console.log(email, password);
			// console.log(user.comparePass(password));
			if (user.validPassword(password) != true) {
				// console.log("upt");
				return done(null, false, { message: "Incorrect Password" });
			}
			// console.log("user");
			return done(null, user);
		});
	}
);

module.exports = { localStrategy };
