let router = require("express").Router();

let {
	OkResponse,
	BadRequestResponse,
	UnauthorizedResponse,
	ForbiddenResponse
} = require("express-http-response");

const FriendModel = require("../../models/Friend");
const UserModel = require("../../models/User");

// General Check
// router.get("/", function (req, res, next) {
// 	return next(new OkResponse({
// 		message: `Friends Api's are working`
// 	}));
// });

// get friend for every time Friend ID given
router.param("friendID", function (req, res, next, _id) {
	FriendModel.findOne({
		_id
	}).then(function (friend) {
		if (!friend) {
			return next(new BadRequestResponse("No friend Found"));
		}
		req.friend = friend;
		// console.log(req.friend);

		return next();
	});
});

// get Sender for every time Sender ID given
router.param("senderID", (req, res, next, _id) => {
	UserModel.findOne({
		_id
	}, (err, user) => {
		if (!err && user !== null) {
			// console.log(user);
			req.sender = user;
			return next();
		}
		return next(new BadRequestResponse("User not found!", 423));;
	});
});

// get Receiver for every time Receiver ID given
router.param("receiverID", (req, res, next, _id) => {
	// console.log(_id);
	UserModel.findOne({
		_id
	}, (err, user) => {
		if (!err && user !== null) {
			// console.log(user);
			req.receiver = user;
			return next();
		}
		return next(new BadRequestResponse("User not found!", 423));;
	});
});

// Add a friend Chat  //Done
router.post("/add/:receiverID/:senderID", (req, res, next) => {
	// console.log("SEnder", req.sender);
	// console.log("Receiver", req.receiver);
	let query = {
		$or: [{
				user1: req.sender._id,
				user2: req.receiver._id
			},
			{
				user2: req.sender._id,
				user1: req.receiver._id
			},
		],
	};
	// console.log(query);
	FriendModel.find(query)
		.then((match) => {
			// console.log(match);
			// console.log(match.length !== 0);
			if (match.length !== 0) {
				next(new OkResponse({
					message: "Already Friends"
				}));
			} else {
				// console.log("friend");
				new FriendModel({
						user1: req.sender._id,
						user2: req.receiver._id
					})
					.save()
					.then((friend) => {
						// console.log(friend);
						next(new OkResponse({
							friend
						}));
					})
					.catch((err) => {
						next(new BadRequestResponse(err));
					});
			}
		})
		.catch((err) => {
			next(new BadRequestResponse(err));
		});
});

// View All Friend's //Done
router.get("/:senderID", function (req, res, next) {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
		populate: [{
				path: "user1",
				model: "User",
				// select: "username",
			},
			{
				path: "user2",
				model: "User",
				// select: "username",
			},
			{
				path: "lastMessage",
				model: "Chat",
				// select: "receiver sender message createdAt",
			},
		],
		sort: {
			updatedAt: -1,
		},
	};
	let query = {
		$or: [{
			user1: req.sender._id
		}, {
			user2: req.sender._id
		}],
	};
	query.isVisited = true;
	query.status = 1;
	// console.log(query);
	FriendModel.paginate(query, options, (err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse("Server Error"));
		} else {
			// console.log(result);
			return next(new OkResponse({
				result: result.docs
			}));
		}
	});
});

// Change is Visited Bit to true //Done
router.put("/visit/:friendID", (req, res, next) => {
	// console.log("Friend", req.friend);
	if (req.friend.isVisited === true) {
		// console.log("IF");
		return next(new ForbiddenResponse("Friend Already Visited"));
	}

	req.friend.isVisited = true;

	req.friend.save((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));;
		} else {
			// console.log("result", result);
			return next(new OkResponse(result));
		}
	});
});

// Delete Friend //Done
router.delete("/del/:friendID/:senderID", async (req, res, next) => {
	if (
		req.sender._id.toString() === req.friend.user1.toString() ||
		req.sender._id.toString() === req.friend.user2.toString()
	) {
		req.friend
			.remove()
			.then((friend) => {
				next(new OkResponse(friend.toJSON()));
				return;
			})
			.catch((err) => {
				next(new BadRequestResponse(err));
				return;
			});
	} else {
		return next(new UnauthorizedResponse("Access Denied"));
	}
});

// Delete Friend Chat //Done
router.delete(
	"/delChats/:friendID",
	(req, res, next) => {
		req.friend.chatMessages = [];
		// console.log(req.toll);
		req.friend
			.save()
			.then((friend) => {
				return next(new OkResponse(friend.toJSON()));
			})
			.catch((err) => {
				return next(new BadRequestResponse(err));
			});
	}
);

module.exports = router;