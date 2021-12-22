let router = require("express").Router();

let { OkResponse, BadRequestResponse } = require("express-http-response");

const {
	isAuthentic,
	isRead,
	isToken,
	isFav,
	isUnFav,
	isMsgDel,
} = require("../auth");

const ChatModel = require("../../models/Chat");
const FriendModel = require("../../models/Friend");
const UserModel = require("../../models/User");
const ImageModel = require("../../models/Image");

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

// get friend for every time friendSlug given
router.param("friendSlug", function (req, res, next, slug) {
	FriendModel.findOne({ slug })
		.populate("user1")
		.populate("user2")
		.then((friend) => {
			if (!friend) {
				return next(new BadRequestResponse("No User Found"));
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

// get Message for every time msgSlug given
router.param("msgSlug", function (req, res, next, slug) {
	ChatModel.findOne({ slug })
		.then((msg) => {
			if (!msg) {
				return next(new BadRequestResponse("No User Found"));
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
router.param("imageSlug", function (req, res, next, slug) {
	ImageModel.findOne({ slug })
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

// Add a new Message or Reply a chat Message
router.post("/chat/:friendSlug", isToken, isAuthentic, (req, res, next) => {
	// console.log(req.body);
	if (req.body.text === undefined || req.body.text.trim().length === 0) {
		// console.log("ID");
		return next(new BadRequestResponse("Missing required parameter", 422));
	}

	// save the text and send Event
	let chat = new ChatModel();

	chat.friendID = req.friend._id;
	chat.sender = req.user._id;
	chat.text = req.body.text;

	if (req.user.email === req.friend.user1.email) {
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
			next(new OkResponse({ Chats: result }));
		}
	});
});

// View All Messages
router.get("/chat/:friendSlug", isToken, isAuthentic, (req, res, next) => {
	// console.log(req.friend);

	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 20,
		sort: {
			createdAt: -1,
		},
	};

	let query = {
		friend: req.friend._id,
	};

	// console.log(query);
	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse("Server Error"));
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
						Receiver:
							req.friend.user1.email === req.user.email
								? req.friend.user2.email
								: req.friend.user1.email,
					},
				})
			);
		}
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// Change chat status to Read
router.put("/readChat/:msgSlug", isToken, isRead, (req, res, next) => {
	console.log(req.user);
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

// Get UnRead Count message
router.get(
	"/unReadCount/:friendSlug",
	isToken,
	isAuthentic,
	(req, res, next) => {
		// console.log(req.user);
		// console.log(req.friend);
		// console.log(req.friend.user1.email);

		// console.log(query);
		ChatModel.count(
			{
				friend: req.friend._id,
				isRead: false,
			},
			(err, count) => {
				if (err) {
					console.log(err);
					return next(new BadRequestResponse(err));
				}
				return next(new OkResponse({ count }));
			}
		);
	}
);

// View All Unread Messages
router.get("/unRead/:friendSlug", isToken, isAuthentic, (req, res, next) => {
	// console.log(req.user);
	// console.log(req.friend);
	// console.log(req.friend.user1.email);

	// console.log(query);

	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 20,
		sort: {
			createdAt: -1,
		},
	};

	let query = {
		friend: req.friend._id,
		isRead: false,
	};

	// console.log(query);
	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse("Server Error"));
		} else {
			// console.log(history.docs);
			// console.log(req.friend.user1.id);
			// console.log(req.friend.user1._id);
			// console.log(req.friend.user1._id.toString() === req.user._id.toString());
			// console.log(req.user._id);
			// console.log(req.friend.user1._id);
			// console.log(req.friend.user2.email);
			// console.log(req.friend.user1.email);
			next(
				new OkResponse({
					Chats: history.docs,
					createdAt: req.friend.createdAt,
					updatedAt: req.friend.updatedAt,
					Receiver:
						req.friend.user1.email === req.user.email
							? req.friend.user2.email
							: req.friend.user1.email,
				})
			);
		}
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// View All Read Messages
router.get("/read/:friendSlug", isToken, isAuthentic, (req, res, next) => {
	// console.log(req.user);
	// console.log(req.friend);
	// console.log(req.friend.user1.email);

	// console.log(query);

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

	// console.log(query);
	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse("Server Error"));
		} else {
			// console.log(history.docs);
			// console.log(req.friend.user1.id);
			// console.log(req.friend.user1._id);
			// console.log(req.friend.user1._id.toString() === req.user._id.toString());
			// console.log(req.user._id);
			// console.log(req.friend.user1._id);
			// console.log(req.friend.user2.email);
			// console.log(req.friend.user1.email);
			next(
				new OkResponse({
					Chats: history.docs,
					createdAt: req.friend.createdAt,
					updatedAt: req.friend.updatedAt,
					Receiver:
						req.friend.user1.email === req.user.email
							? req.friend.user2.email
							: req.friend.user1.email,
				})
			);
		}
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// Add Chat Message to Favorites
router.put("/fav/:msgSlug", isToken, isFav, (req, res, next) => {
	// console.log(req.user);
	req.msg.isFav = true;

	req.msg.save((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		} else {
			// console.log(result);
			return next(new OkResponse({ Chat: result.toJSON() }));
		}
	});
});

// UnFavorite a chat
router.put("/unFav/:msgSlug", isToken, isUnFav, (req, res, next) => {
	// console.log(req.user);
	req.msg.isFav = false;

	req.msg.save((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		} else {
			// console.log(result);
			return next(new OkResponse({ Chat: result.toJSON() }));
		}
	});
});

// Edit a chat
router.put("/editChat/:msgSlug", isToken, (req, res, next) => {
	// console.log(req.body);
	if (req.body.text === undefined || req.body.text.trim().length === 0) {
		return next(new BadRequestResponse("Missing required parameter", 422));
	}
	req.msg.text = req.body.text;

	req.msg.save((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		} else {
			// console.log(result);
			return next(new OkResponse({ Chat: result.toJSON() }));
		}
	});
});

// View All Favorite Chat Messages
router.get("/favChat/:friendSlug", isToken, isAuthentic, (req, res, next) => {
	// console.log(query);

	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 20,
		sort: {
			createdAt: -1,
		},
	};

	let query = {
		friend: req.friend._id,
		isFav: true,
	};

	// console.log(query);
	ChatModel.paginate(query, options, (err, history) => {
		if (err) {
			// console.log(err);
			next(new BadRequestResponse("Server Error"));
		} else {
			next(
				new OkResponse({
					Chats: history.docs,
					createdAt: req.friend.createdAt,
					updatedAt: req.friend.updatedAt,
					Receiver:
						req.friend.user1.email === req.user.email
							? req.friend.user2.email
							: req.friend.user1.email,
				})
			);
		}
	}).catch((error) => {
		console.log(error);
		next(new BadRequestResponse(error));
	});
});

// Delete a Message
router.put("/delChat/:msgSlug", isToken, isMsgDel, (req, res, next) => {
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
