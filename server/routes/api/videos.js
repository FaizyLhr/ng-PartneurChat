const router = require("express").Router();
const { OkResponse, BadRequestResponse } = require("express-http-response");

const { isToken } = require("../auth");

const FriendModel = require("../../models/Friend");
const ChatModel = require("../../models/Chat");
const VideoModel = require("../../models/Video");

const { vUpload } = require("../../utilities/multer");

const videoUpload = vUpload.fields([{ name: "videos", maxCount: 10 }]);

// get Message for every time chatSlug given
router.param("chatSlug", function (req, res, next, slug) {
	ChatModel.findOne({ slug })
		.then((chat) => {
			if (!chat) {
				return next(new BadRequestResponse("No Chat Found"));
			}
			req.chat = chat;
			// console.log(req.chat);
			return next();
		})
		.catch((err) => {
			// console.log(err);
			return next(new BadRequestResponse(err));
		});
});

// get Video for every time videoSlug given
router.param("videoSlug", function (req, res, next, slug) {
	VideoModel.findOne({ slug })
		.then((video) => {
			if (!video) {
				return next(new BadRequestResponse("No video Found"));
			}
			req.video = video;
			// console.log(req.video);
			return next();
		})
		.catch((err) => {
			// console.log(err);
			return next(new BadRequestResponse(err));
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

// Send Video
router.post("/sendVideo/:chatSlug", isToken, videoUpload, (req, res, next) => {
	// Convert Multipart body data to JSON
	let bodyJSON = JSON.stringify(req.files);
	// console.log(bodyJSON);
	// Convert JSON to Object
	let body = JSON.parse(bodyJSON);
	body.videos.forEach((e) => {
		let video = new VideoModel();

		video.fileName = e.filename;
		video.URL = e.path;
		video.size = e.size;
		video.ext = e.mimetype;
		video.chatID = req.chat._id;

		FriendModel.findOne({ _id: req.chat.friendID })
			.then((friend) => {
				if (!friend) {
					return next(new BadRequestResponse("No Friend Found"));
				}
				friend.videos.push(video._id);

				video.friendID = friend._id;

				video.save((err, result) => {
					if (err) {
						return next(new BadRequestResponse(err));
					} else {
						req.chat.videos.push(result._id);

						req.chat.save((err, result) => {
							if (err) {
								return next(new BadRequestResponse(err));
							}

							friend.save((err, result) => {
								if (err) return next(new BadRequestResponse(err));
								console.log("Video ID Removed");
							});

							// allSportsSocket.emit("conversation" + chat.receiver);
							// next(new OkResponse({ proposal: proposal }));
							console.log("Video ID Added");
						});

						// console.log(result);
						next(new OkResponse({ videos: result }));
					}
				});
			})
			.catch((err) => {
				// console.log(err);
				return next(new BadRequestResponse(err));
			});
	});
});

// View All videos of Chat
router.get("/videosChat/:chatSlug", isToken, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
	};

	let query = {};
	query.chatID = req.chat._id;

	VideoModel.paginate(query, options, function (err, result) {
		if (err) {
			return next(new BadRequestResponse(err));
		}
		result.docs = result.docs.map((video) => video.toJSON());
		return next(new OkResponse({ result: result.docs }));
	}).catch((e) => {
		console.log(e);
		return next(new BadRequestResponse(e.error));
	});
});

// View All videos of Friend
router.get("/videosFriend/:friendSlug", isToken, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
		// populate: "chatID",
	};

	let query = {};
	query.friendID = req.friend._id;

	VideoModel.paginate(query, options, function (err, result) {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse("Server Error"), 500);
		}
		// console.log(result);
		result.docs = result.docs.map((video) => video.toJSON());
		// console.log(":::Result:::::", result);
		// console.log(":::Result Docs:::::", result.docs);
		return next(new OkResponse({ result: result.docs }));
	}).catch((e) => {
		console.log(e);
		return next(new BadRequestResponse(e.error));
	});
});

// Delete a Video
router.delete("/delVideo/:videoSlug", isToken, (req, res, next) => {
	console.log(req.video);

	req.video.remove((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		}
		// console.log("ID:::", req.video.chatID);
		ChatModel.findOne({ _id: req.video.chatID })
			.then((chat) => {
				if (!chat) {
					return next(new BadRequestResponse("No Chat Found"));
				}

				// console.log(chat);
				const index = chat.videos.indexOf(req.video._id);
				if (index === -1) {
					return next(new BadRequestResponse("No video Found"));
				}
				// console.log("::::::::::index:::::::::", index);
				// console.log(categories);
				chat.videos.splice(index, 1);
				// console.log(req.chat);
				chat.save((err, result) => {
					if (err) return next(new BadRequestResponse(err));

					FriendModel.findOne({ _id: chat.friendID })
						.then((friend) => {
							if (!friend) {
								return next(new BadRequestResponse("No Friend Found"));
							}
							const frIndex = friend.videos.indexOf(req.video._id);
							// console.log("::::::::::index:::::::::", index);

							if (frIndex === -1) {
								return next(new BadRequestResponse("No Video Found"));
							}
							friend.videos.splice(frIndex, 1);

							friend.save((err, result) => {
								if (err) return next(new BadRequestResponse(err));
								console.log("Video ID Removed From Friend");
							});
						})
						.catch((err) => {
							// console.log(err);
							return next(new BadRequestResponse(err));
						});
					console.log("Video ID Removed from Chat");
				});
			})
			.catch((err) => {
				// console.log(err);
				return next(new BadRequestResponse(err));
			});
		// console.log(result);
		return next(new OkResponse(req.video.toJSON()));
	});
});

module.exports = router;
