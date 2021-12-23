let router = require("express").Router();

let {
	OkResponse,
	BadRequestResponse
} = require("express-http-response");

const {
	isAuthentic,
	isRead,
	isMsgDel,
} = require("../auth");

const ChatModel = require("../../models/Chat");
const FriendModel = require("../../models/Friend");
const UserModel = require("../../models/User");
const ImageModel = require("../../models/Image");

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

// get friend for every time friendSlug given
router.param("friendID", function (req, res, next, _id) {
	FriendModel.findOne({
			_id
		})
		.populate("user1")
		.populate("user2")
		.then((friend) => {
			if (!friend) {
				return next(new BadRequestResponse("No Friend Found"));
			}
			req.friend = friend;
			// console.log(req.friend);
			return next();
		})
		.catch((err) => {
			// console.log(err);
			return next(new BadRequestResponse(err));
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

// get Message for every time msgSlug given
router.param("msgID", function (req, res, next, _id) {
	ChatModel.findOne({
			_id
		})
		.then((msg) => {
			if (!msg) {
				return next(new BadRequestResponse("No Message Found"));
			}
			req.msg = msg;
			// console.log(req.msg);
			return next();
		})
		.catch((err) => {
			// console.log(err);
			return next(new BadRequestResponse(err));
		});
});

// get Image for every time imageSlug given
router.param("imageID", function (req, res, next, _id) {
	ImageModel.findOne({
			_id
		})
		.then((image) => {
			if (!image) {
				return next(new BadRequestResponse("No User Found"));
			}
			req.image = image;
			// console.log(req.image);
			return next();
		})
		.catch((err) => {
			// console.log(err);
			return next(new BadRequestResponse(err));
		});
});

// Add a new Message or Reply a chat Message //Done
router.post("/add/:friendID/:senderID", isAuthentic, (req, res, next) => {
	// console.log(req.body);
	if (req.body.text === undefined || req.body.text.trim().length === 0) {
		// console.log("ID");
		return next(new BadRequestResponse("Missing required parameter", 422));
	}

	// save the text and send Event
	let chat = new ChatModel();

	chat.friendID = req.friend._id;
	chat.sender = req.sender._id;
	chat.text = req.body.text;

	if (req.sender.email === req.friend.user1.email) {
		chat.receiver = req.friend.user2;
	} else {
		chat.receiver = req.friend.user1;
	}

	if (req.body.replyTo) {
		chat.reply = req.body.replyTo;
	}

	// console.log("text:::::::::::::", chat);
	// console.log("SentTo:::::::::::::", chat.receiver);

	chat.save(function (err, result) {
		if (err) {
			return next(new BadRequestResponse("Server Error"));
		} else {
			req.friend.chatMessages.push(chat._id);
			req.friend.lastMessage = chat._id;
			req.friend
				.save()
				.then(() => {
					// allSportsSocket.emit("conversation" + chat.receiver);
					// next(new OkResponse({ proposal: proposal }));
					console.log("Message ID Added");
				})
				.catch((err) => next(new BadRequestResponse(err)));
			// console.log(result);
			next(new OkResponse(result));
		}
	});
});

// View All Messages of Friend // Done
router.get("/get/all/:friendID", (req, res, next) => {
	// console.log(req.friend);
	// console.log(req.sender);
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 20,
		sort: {
			createdAt: -1,
		},
	};

	let query = {};
	query.friendID = req.friend._id;

	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			console.log("err", err);
			// console.log(err);
			next(new BadRequestResponse(err));
		} else {
			// console.log(history.docs);
			next(
				new OkResponse({
					Chat: history.docs,
					user: {
						_id: req.friend._id,
						lastMessage: req.friend.lastMessage,
						createdAt: req.friend.createdAt,
						updatedAt: req.friend.updatedAt,
						Receiver: req.friend.user1.email === req.sender.email ?
							req.friend.user2.email : req.friend.user1.email,
					},
				})
			);
		}
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// Change chat status to Read //Done
router.put("/read/:msgID", isRead, (req, res, next) => {
	// console.log(req.user);
	req.msg.isRead = true;

	req.msg.save((err, result) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse(err));
			return;
		} else {
			// console.log(result);
			next(new OkResponse(req.msg.toJSON()));
			return;
		}
	});
});

// Get UnRead Count message //Done
router.get(
	"/get/unReadCount/:friendID", (req, res, next) => {
		// console.log(query);
		ChatModel.count({
				friend: req.friend._id,
				isRead: false,
			},
			(err, count) => {
				if (err) {
					console.log(err);
					return next(new BadRequestResponse(err));
				}
				return next(new OkResponse({
					count
				}));
			}
		);
	}
);

// View All Unread Messages //Done
router.get("/get/unRead/:friendID/:senderID", isAuthentic, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 20,
		sort: {
			createdAt: -1,
		},
	};

	let query = {
		friendID: req.friend._id,
		isRead: false,
	};

	// console.log(query);
	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse("Server Error"));
		}

		next(
			new OkResponse({
				Chats: history.docs,
				createdAt: req.friend.createdAt,
				updatedAt: req.friend.updatedAt,
				Receiver: req.friend.user1.email === req.sender.email ?
					req.friend.user2.email : req.friend.user1.email,
			})
		);
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// View All Read Messages //Done
router.get("/get/read/:friendID/:senderID", isAuthentic, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 20,
		sort: {
			createdAt: -1,
		},
	};

	let query = {
		friend: req.friend._id,
		isRead: true,
	};

	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			// console.log("err", err);
			return next(new BadRequestResponse(err));
		}
		next(
			new OkResponse({
				Chats: history.docs,
				createdAt: req.friend.createdAt,
				updatedAt: req.friend.updatedAt,
				Receiver: req.friend.user1.email === req.sender.email ?
					req.friend.user2.email : req.friend.user1.email,
			})
		);
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// Delete a Message //Done
router.put("/del/:msgID", isMsgDel, (req, res, next) => {
	console.log(req.user);
	req.msg.isDeleted = true;
	req.msg.text = null;

	req.msg.save((err, result) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse(err));
			return;
		} else {
			// console.log(result);
			next(new OkResponse(req.msg.toJSON()));
			return;
		}
	});
});

module.exports = router;