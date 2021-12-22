let router = require("express").Router();
let { OkResponse, BadRequestResponse } = require("express-http-response");

const { isToken } = require("../auth");

const FriendModel = require("../../models/Friend");
const ChatModel = require("../../models/Chat");
const ImageModel = require("../../models/Image");

const { iUpload, upload } = require("../../utilities/multer");

// const cpUpload = upload.fields([{ name: "images", maxCount: 10 }]);

const cpUpload = upload.fields([{ name: "images", maxCount: 10 }]);
const imageUpload = iUpload.fields([{ name: "images", maxCount: 10 }]);

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
router.param("imageSlug", function (req, res, next, slug) {
	ImageModel.findOne({ slug })
		.then((image) => {
			if (!image) {
				return next(new BadRequestResponse("No Image Found"));
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

// Send Image
router.post("/sendImage/:chatSlug", isToken, cpUpload, (req, res, next) => {
	// Convert Multipart body data to JSON
	let bodyJSON = JSON.stringify(req.files);
	// console.log(bodyJSON);
	// Convert JSON to Object
	let body = JSON.parse(bodyJSON);
	body.images.forEach((e) => {
		// console.log("e:::::::::", e);
		// console.log("FileName", e.filename);
		// console.log("URL", e.path);
		// console.log("size", e.size);
		// console.log("ext", e.mimetype);
		// console.log("msgID", req.chat._id);
		let image = new ImageModel();

		image.fileName = e.filename;
		image.URL = e.path;
		image.size = e.size;
		image.ext = e.mimetype;
		image.chatID = req.chat._id;

		FriendModel.findOne({ _id: req.chat.friendID })
			.then((friend) => {
				if (!friend) {
					return next(new BadRequestResponse("No Friend Found"));
				}
				friend.images.push(image._id);

				image.friendID = friend._id;

				image.save((err, result) => {
					if (err) {
						return next(new BadRequestResponse(err));
					} else {
						req.chat.images.push(result._id);

						req.chat.save((err, result) => {
							if (err) {
								return next(new BadRequestResponse(err));
							}

							friend.save((err, result) => {
								if (err) return next(new BadRequestResponse(err));
								console.log("Image ID Removed");
							});

							// allSportsSocket.emit("conversation" + chat.receiver);
							// next(new OkResponse({ proposal: proposal }));
							console.log("Image ID Added");
						});

						// console.log(result);
						next(new OkResponse({ images: result }));
					}
				});
			})
			.catch((err) => {
				// console.log(err);
				return next(new BadRequestResponse(err));
			});
	});
});

// View All Images of Chat
router.get("/imagesChat/:chatSlug", isToken, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
	};

	let query = {};
	query.chatID = req.chat._id;

	ImageModel.paginate(query, options, function (err, result) {
		if (err) {
			return next(new BadRequestResponse(err));
		}
		result.docs = result.docs.map((image) => image.toJSON());
		return next(new OkResponse({ result: result.docs }));
	}).catch((e) => {
		console.log(e);
		return next(new BadRequestResponse(e.error));
	});
});

// View All Images of Friend
router.get("/imagesFriend/:friendSlug", isToken, (req, res, next) => {
	const options = {
		page: +req.query.page || 1,
		limit: +req.query.limit || 10,
		// populate: "chatID",
	};

	let query = {};
	query.friendID = req.friend._id;

	ImageModel.paginate(query, options, function (err, result) {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse("Server Error"), 500);
		}
		// console.log(result);
		result.docs = result.docs.map((user) => user.toJSON());
		// console.log(":::Result:::::", result);
		// console.log(":::Result Docs:::::", result.docs);
		return next(new OkResponse({ result: result.docs }));
	}).catch((e) => {
		console.log(e);
		return next(new BadRequestResponse(e.error));
	});
});

// Delete a Message
router.delete("/delImage/:imageSlug", isToken, (req, res, next) => {
	console.log(req.image);

	req.image.remove((err, result) => {
		if (err) {
			// console.log(err);
			return next(new BadRequestResponse(err));
		}
		// console.log("ID:::", req.image.chatID);
		ChatModel.findOne({ _id: req.image.chatID })
			.then((chat) => {
				if (!chat) {
					return next(new BadRequestResponse("No Chat Found"));
				}

				// console.log(chat);
				const index = chat.images.indexOf(req.image._id);
				if (index === -1) {
					return next(new BadRequestResponse("No Image Found"));
				}
				// console.log("::::::::::index:::::::::", index);
				// console.log(categories);
				chat.images.splice(index, 1);
				// console.log(req.chat);
				chat.save((err, result) => {
					if (err) return next(new BadRequestResponse(err));

					FriendModel.findOne({ _id: chat.friendID })
						.then((friend) => {
							if (!friend) {
								return next(new BadRequestResponse("No Friend Found"));
							}
							const frIndex = friend.images.indexOf(req.image._id);
							console.log("::::::::::index:::::::::", index);

							if (frIndex === -1) {
								return next(new BadRequestResponse("No Image Found"));
							}
							friend.images.splice(frIndex, 1);

							friend.save((err, result) => {
								if (err) return next(new BadRequestResponse(err));
								console.log("Image ID Removed From Friend");
							});
						})
						.catch((err) => {
							// console.log(err);
							return next(new BadRequestResponse(err));
						});
					console.log("Image ID Removed from Chat");
				});
			})
			.catch((err) => {
				// console.log(err);
				return next(new BadRequestResponse(err));
			});
		// console.log(result);
		return next(new OkResponse(req.image.toJSON()));
	});
});

module.exports = router;
