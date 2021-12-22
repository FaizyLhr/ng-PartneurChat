let router = require("express").Router();

const passport = require("passport");

let {
	OkResponse,
	BadRequestResponse,
	UnauthorizedResponse,
} = require("express-http-response");

const UserModel = require("../../models/User");

const getToken = require("../../utilities/getToken");

const {
	isAdmin,
	isUnBlocked,
	isBlocked,
	isTutor,
	isStudent,
	isToken,
} = require("../auth");

var emailService = require("../../utilities/emailService");

// Acquiring Passport
const { localStrategy } = require("../../utilities/passport");

// console.log(localStrategy);
passport.use(localStrategy);
router.use(passport.initialize());

// get user for every time mail given
router.param("email", (req, res, next, email) => {
	UserModel.findOne({ email }, (err, user) => {
		if (!err && user !== null) {
			// console.log(user);
			req.emailUser = user;
			return next();
		}
		next(new BadRequestResponse("User not found!", 423));
		return;
	});
});

// General Check
router.get("/", function (req, res, next) {
	next(new OkResponse({ message: `Users Api's are working` }));
	return;
});

// Signup
router.post("/signup", (req, res, next) => {
	const { email, username, password } = req.body.user;

	// console.log(req.body.user);
	if (
		email.length === 0 ||
		typeof email === "undefined" ||
		username.length === 0 ||
		typeof username === "undefined" ||
		password.length === 0 ||
		typeof password === "undefined"
	) {
		next(new BadRequestResponse("Missing required parameter", 422));
		return;
	}

	// Create user in our database
	let newUser = UserModel();

	newUser.email = email;
	newUser.username = username;

	newUser.setPassword(password);

	// console.log("otp");
	newUser.setOTP();

	// console.log(newUser);
	newUser.save((err, result) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse(err));
			return;
		} else {
			// console.log(result);
			emailService.sendEmailVerificationOTP(result);
			next(
				new OkResponse({
					message:
						"SignUp successfully an OTP sent to your email please verify your email address",
				})
			);
			return;
		}
	});
});

// verifyOTP
router.post("/otp/verify", (req, res, next) => {
	if (!(req.body.email && req.body.otp && req.body.type)) {
		return next({
			err: new BadRequestResponse("Missing required parameter", 422),
		});
	}
	// console.log(req.body);
	let query = {
		email: req.body.email,
		otp: req.body.otp,
		otpExpires: { $gt: Date.now() },
	};
	// console.log(query);

	UserModel.findOne(query, function (err, user) {
		if (err || !user) {
			// console.log(err);
			// console.log(user);
			return next(
				{ err: new UnauthorizedResponse("Invalid OTP || Invalid Email") },
				401.1
			);
		}

		// console.log("Users::::::::", user);
		user.otp = null;
		user.otpExpires = null;
		if (req.body.type === 1) {
			user.isEmailVerified = true;
			console.log("user is verified");
		} else {
			user.generatePasswordRestToken();
		}
		// console.log(user);
		user.save((err, result) => {
			// console.log("result", result);
			if (err) {
				return next(new BadRequestResponse(err));
			}
			if (req.body.type === 1) {
				return next(new OkResponse({ user: result.toAuthJSON() }));
			} else if (req.body.type === 2) {
				return next(
					new OkResponse({ passwordRestToken: result.resetPasswordToken })
				);
			}
		});
	});
});

// Resend OTP
router.post("/otp/resend/:email", (req, res, next) => {
	req.emailUser.setOTP();
	req.emailUser.save((err, user) => {
		emailService.sendEmailVerificationOTP(req.emailUser);
		return next(
			new OkResponse({
				message: "OTP sent Successfully to registered email address",
			})
		);
	});
});

// Reset Password
router.post("/reset/password/:email", (req, res, next) => {
	// console.log(req.body);
	// console.log(req.emailUser.resetPasswordToken);
	if (req.body.resetPasswordToken !== req.emailUser.resetPasswordToken) {
		next({ err: new UnauthorizedResponse("Invalid Password Reset Token") });
		return;
	}
	req.emailUser.setPassword(req.body.password);
	req.emailUser.resetPasswordToken = null;
	// console.log(req.emailUser);
	req.emailUser.save((err, user) => {
		if (err) {
			next(new BadRequestResponse(err));
			return;
		}
		// console.log(user);
		next(new OkResponse({ user: user.toAuthJSON() }));
		return;
	});
});

// Login
router.post(
	"/login",
	passport.authenticate("local", { session: false }),
	getToken,
	(req, res, next) => {
		return next(new OkResponse(req.user.toAuthJSON()));
	}
);

// User context Api
router.get("/context", isToken, function (req, res, next) {
	let user = req.user;
	return next(new OkResponse(user.toAuthJSON()));
});

// View All users
router.get("/users", isToken, isAdmin, (req, res, next) => {
	console.log("Inside");
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
	};

	let query = {};
	// query.role = 1;

	UserModel.paginate(query, options, function (err, result) {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse("Server Error"), 500);
			return;
		}
		// console.log(result);
		result.docs = result.docs.map((user) => user.toJSON());
		// console.log(":::Result:::::", result);
		// console.log(":::Result Docs:::::", result.docs);
		next(new OkResponse({ result: result.docs }));
		return;
	}).catch((e) => {
		console.log(e);
		next(new BadRequestResponse(e.error));
		return;
	});
});

// View Specific User
router.get("/view/:email", isToken, (req, res, next) => {
	if (req.user.email === req.emailUser.email || req.user.role === 1) {
		UserModel.findOne({ email: req.emailUser.email })
			.then((user) => {
				next(new OkResponse(user.toJSON()));
				return;
			})
			.catch((err) => {
				next(new BadRequestResponse(err));
				return;
			});
	} else {
		next(new UnauthorizedResponse("Access Denied"));
		return;
	}
});

// Update Specific User
router.put("/update/:email", isToken, (req, res, next) => {
	// console.log("Context User:::::::::::::", req.user);
	// console.log("Required::::::::::::::::::::", req.emailUser);
	if (req.user.email === req.emailUser.email || req.user.role === 1) {
		UserModel.findOne({ email: req.emailUser.email })
			.then((updateUser) => {
				// console.log(updateUser);
				console.log(req.body);

				if (req.body.email) {
					updateUser.email = req.body.email;
				}
				if (req.body.category) {
					updateUser.category = req.body.category;
				}
				if (req.body.nameChinese) {
					updateUser.nameChinese = req.body.nameChinese;
				}
				if (req.body.nameEng) {
					updateUser.nameEng = req.body.nameEng;
				}
				if (req.body.phone) {
					updateUser.phone = req.body.phone;
				}
				if (req.body.age) {
					updateUser.age = req.body.age;
				}
				if (req.body.gender) {
					updateUser.gender = req.body.gender;
				}
				if (req.body.profilePic) {
					updateUser.profilePic = req.body.profilePic;
				}
				if (req.body.backgroundPic) {
					updateUser.backgroundPic = req.body.backgroundPic;
				}
				if (req.body.password) {
					updateUser.setPassword(req.body.password);
				}
				if (req.emailUser.role === 2) {
					if (req.body.tutor) {
						if (req.body.tutor.experience) {
							updateUser.tutor.experience = req.body.tutor.experience;
						}
						if (req.body.tutor.expertise) {
							updateUser.tutor.expertise = req.body.tutor.expertise;
						}
						if (req.body.tutor.fbLink) {
							updateUser.tutor.fbLink = req.body.tutor.fbLink;
						}
						if (req.body.tutor.instaLink) {
							updateUser.tutor.instaLink = req.body.tutor.instaLink;
						}
						if (req.body.tutor.youtubeLink) {
							updateUser.tutor.youtubeLink = req.body.tutor.youtubeLink;
						}
					}
				}
				if (req.emailUser.role === 3) {
					if (req.body.student) {
						if (req.body.student.interested) {
							updateUser.student.interested = req.body.student.interested;
						}
						if (req.body.student.intro) {
							updateUser.student.intro = req.body.student.intro;
						}
					}
				}

				// console.log(updateUser);

				updateUser
					.save()
					.then((user) => {
						next(new OkResponse(user.toJSON()));
						return;
					})
					.catch((err) => {
						next(new BadRequestResponse(err));
						return;
					});
			})
			.catch((err) => {
				next(new BadRequestResponse(err));
				return;
			});
	} else {
		next(new UnauthorizedResponse("Access Denied"));
	}
});

// delete Specific User
router.delete("/delUser/:email", isToken, isAdmin, async (req, res, next) => {
	req.emailUser
		.remove()
		.then((user) => {
			next(new OkResponse(user.toJSON()));
			return;
		})
		.catch((err) => {
			next(new BadRequestResponse(err));
			return;
		});
});

module.exports = router;
