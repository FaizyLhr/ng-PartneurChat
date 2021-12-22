const jwt = require("jsonwebtoken");

const TOKEN_KEY = "faizy";

const getToken = async (req, res, next) => {
	// console.log(req.user);
	// Create Token
	const token = jwt.sign(
		{ user_id: req.user._id },
		process.env.TOKEN_KEY || TOKEN_KEY,
		{
			expiresIn: "2h",
		}
	);
	// save user token
	req.user.token = token;
	// console.log(req.user.token);
	next();
};

module.exports = getToken;
