let router = require("express").Router();

let { OkResponse, BadRequestResponse, UnauthorizedResponse, ForbiddenResponse } = require("express-http-response");

const chatGroupModel = require("../../models/ChatGroup");
const UserModel = require("../../models/User");

// General Check
// router.get("/", function (req, res, next) {
// 	return next(new OkResponse({
// 		message: `Friends Api's are working`
// 	}));
// });

// get friend for every time Friend ID given
router.param("chatGroupID", function (req, res, next, _id) {
	chatGroupModel.findOne({ _id }).then(function (chatGroup) {
		if (!chatGroup) {
			return next(new BadRequestResponse("No chatGroup Found"));
		}
		req.chatGroup = chatGroup;
		// console.log(req.chatGroup);

		return next();
	});
});

// get Sender for every time Sender ID given
router.param("senderID", (req, res, next, _id) => {
	UserModel.findOne({ _id }, (err, user) => {
		if (!err && user !== null) {
			// console.log(user);
			req.sender = user;
			return next();
		}
		return next(new BadRequestResponse("User not found!", 423));
	});
});

// get Receiver for every time Receiver ID given
router.param("receiverID", (req, res, next, _id) => {
	// console.log(_id);
	UserModel.findOne({ _id }, (err, user) => {
		if (!err && user !== null) {
			// console.log(user);
			req.receiver = user;
			return next();
		}
		return next(new BadRequestResponse("User not found!", 423));
	});
});

// Add a friend Chat  //Done
router.post("/add/:receiverID/:senderID", (req, res, next) => {
	// console.log("SEnder", req.sender);
	// console.log("Receiver", req.receiver);
	let query = {
		$or: [
			{
				user1: req.sender._id,
				user2: req.receiver._id,
			},
			{
				user2: req.sender._id,
				user1: req.receiver._id,
			},
		],
	};
	// console.log(query);
	chatGroupModel
		.find(query)
		.then((match) => {
			// console.log(match);
			// console.log(match.length !== 0);
			if (match.length !== 0) {
				next(
					new OkResponse({
						message: "Already chatGroup",
					})
				);
			} else {
				new chatGroupModel({
					user1: req.sender._id,
					user2: req.receiver._id,
				})
					.save()
					.then((chatGroup) => {
						// console.log(chatGroup);
						next(new OkResponse({ chatGroup }));
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
		populate: [
			{
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
		$or: [{ user1: req.sender._id }, { user2: req.sender._id }],
	};
	query.isVisited = true;
	query.status = 1;
	// console.log(query);
	chatGroupModel.paginate(query, options, (err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse("Server Error"));
		} else {
			// console.log(result);
			return next(new OkResponse({ result: result.docs }));
		}
	});
});

// Change is Visited Bit to true //Done
router.put("/visit/:chatGroupID", (req, res, next) => {
	// console.log("Friend", req.friend);
	if (req.chatGroup.isVisited === true) {
		// console.log("IF");
		return next(new ForbiddenResponse("chatGroup Already Visited"));
	}

	req.chatGroup.isVisited = true;

	req.chatGroup.save((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		} else {
			// console.log("result", result);
			return next(new OkResponse(result));
		}
	});
});

// Delete Friend //Done
router.delete("/del/:chatGroupID/:senderID", async (req, res, next) => {
	if (req.sender._id.toString() === req.chatGroup.user1.toString() || req.sender._id.toString() === req.chatGroup.user2.toString()) {
		req.chatGroup
			.remove()
			.then((chatGroup) => {
				next(new OkResponse(chatGroup));
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
router.delete("/delChats/:chatGroupID", (req, res, next) => {
	req.chatGroup.chatMessages = [];
	// console.log(req.toll);
	req.chatGroup
		.save()
		.then((chatGroup) => {
			return next(new OkResponse(chatGroup));
		})
		.catch((err) => {
			return next(new BadRequestResponse(err));
		});
});

module.exports = router;
