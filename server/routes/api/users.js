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
const {
	localStrategy
} = require("../../utilities/passport");

// console.log(localStrategy);
passport.use(localStrategy);
router.use(passport.initialize());

// get user for every time mail given
router.param("email", (req, res, next, email) => {
	UserModel.findOne({
		email
	}, (err, user) => {
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
	next(new OkResponse({
		message: `Users Api's are working`
	}));
	return;
});

// User context Api
router.get("/context", isToken, function (req, res, next) {
	let user = req.user;
	return next(new OkResponse(user.toAuthJSON()));
});



module.exports = router;