let router = require("express").Router();
let { OkResponse, BadRequestResponse } = require("express-http-response");

const { isToken } = require("../auth");

const FriendModel = require("../../models/Friend");
const ChatModel = require("../../models/Chat");
const AudioModel = require("../../models/Audio");

const { aUpload } = require("../../utilities/multer");

const audioUpload = aUpload.fields([{ name: "audios", maxCount: 10 }]);

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

// get Image for every time imageSlug given
router.param("audioSlug", function (req, res, next, slug) {
	AudioModel.findOne({ slug })
		.then((audio) => {
			if (!audio) {
				return next(new BadRequestResponse("No audio Found"));
			}
			req.audio = audio;
			// console.log(req.audio);
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

// Send Audio
router.post("/sendAudio/:chatSlug", isToken, audioUpload, (req, res, next) => {
	console.log("Enter");
	// Convert Multipart body data to JSON
	let bodyJSON = JSON.stringify(req.files);
	// console.log(bodyJSON);
	// Convert JSON to Object
	let body = JSON.parse(bodyJSON);
	body.audios.forEach((e) => {
		let audio = new AudioModel();

		audio.fileName = e.filename;
		audio.URL = e.path;
		audio.size = e.size;
		audio.ext = e.mimetype;
		audio.chatID = req.chat._id;

		FriendModel.findOne({ _id: req.chat.friendID })
			.then((friend) => {
				if (!friend) {
					return next(new BadRequestResponse("No Friend Found"));
				}
				friend.audios.push(audio._id);

				audio.friendID = friend._id;

				audio.save((err, result) => {
					if (err) {
						return next(new BadRequestResponse(err));
					} else {
						req.chat.audios.push(result._id);

						req.chat.save((err, result) => {
							if (err) {
								return next(new BadRequestResponse(err));
							}

							friend.save((err, result) => {
								if (err) return next(new BadRequestResponse(err));
								console.log("Audio ID Removed");
							});

							// allSportsSocket.emit("conversation" + chat.receiver);
							// next(new OkResponse({ proposal: proposal }));
							console.log("Audio ID Added");
						});

						// console.log(result);
						next(new OkResponse({ audios: result }));
					}
				});
			})
			.catch((err) => {
				// console.log(err);
				return next(new BadRequestResponse(err));
			});
	});
});

// View All Audios of Chat
router.get("/audiosChat/:chatSlug", isToken, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
	};

	let query = {};
	query.chatID = req.chat._id;

	AudioModel.paginate(query, options, function (err, result) {
		if (err) {
			return next(new BadRequestResponse(err));
		}
		result.docs = result.docs.map((audio) => audio.toJSON());
		return next(new OkResponse({ result: result.docs }));
	}).catch((e) => {
		// console.log(e);
		return next(new BadRequestResponse(e.error));
	});
});

// View All audios of Friend
router.get("/audiosFriend/:friendSlug", isToken, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
		// populate: "chatID",
	};

	let query = {};
	query.friendID = req.friend._id;

	AudioModel.paginate(query, options, function (err, result) {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse("Server Error"), 500);
		}
		// console.log(result);
		result.docs = result.docs.map((audio) => audio.toJSON());
		// console.log(":::Result:::::", result);
		// console.log(":::Result Docs:::::", result.docs);
		return next(new OkResponse({ result: result.docs }));
	}).catch((e) => {
		// console.log(e);
		return next(new BadRequestResponse(e.error));
	});
});

// Delete a Audio
router.delete("/delAudio/:audioSlug", isToken, (req, res, next) => {
	req.audio.remove((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		}
		// console.log("ID:::", req.audio.chatID);
		ChatModel.findOne({ _id: req.audio.chatID })
			.then((chat) => {
				if (!chat) {
					return next(new BadRequestResponse("No Chat Found"));
				}

				// console.log(chat);
				const index = chat.audios.indexOf(req.audio._id);
				if (index === -1) {
					return next(new BadRequestResponse("No Audio Found"));
				}
				// console.log("::::::::::index:::::::::", index);
				// console.log(categories);
				chat.audios.splice(index, 1);
				// console.log(req.chat);
				chat.save((err, result) => {
					if (err) return next(new BadRequestResponse(err));

					FriendModel.findOne({ _id: chat.friendID })
						.then((friend) => {
							if (!friend) {
								return next(new BadRequestResponse("No Friend Found"));
							}
							const frIndex = friend.audios.indexOf(req.audio._id);
							// console.log("::::::::::index:::::::::", index);

							if (frIndex === -1) {
								return next(new BadRequestResponse("No Audio Found"));
							}
							friend.audios.splice(frIndex, 1);

							friend.save((err, result) => {
								if (err) return next(new BadRequestResponse(err));
								console.log("Audio ID Removed From Friend");
							});
						})
						.catch((err) => {
							// console.log(err);
							return next(new BadRequestResponse(err));
						});
					console.log("Audio ID Removed from Chat");
				});
			})
			.catch((err) => {
				// console.log(err);
				return next(new BadRequestResponse(err));
			});
		// console.log(result);
		return next(new OkResponse(req.audio.toJSON()));
	});
});

module.exports = router;
