var mongoose = require("mongoose");
var auth = require("../routes/auth");

var Chat = mongoose.model("Chat");
// var Notification = mongoose.model("Notification");

module.exports = () => {
	ngPartneurChat.on("connection", (socket) => {
		console.log("Client connected to home", socket.id);
		// create Notification
		socket.on("createNotification", (notification) => {
			console.log("here", notification);

			notification.sentTo.forEach((element) => {
				new Notification({
					createdBy: notification.createdBy,
					description: notification.description,
					category: notification.category,
					sentTo: element,
					naviagteUrl: notification.naviagteUrl,
				}).save((err, doc) => {
					if (doc) {
						doc
							.populate("createdBy", "firstName lastName image _id")
							.populate("sentTo", "firstName lastName image _id")
							.execPopulate((err, doc) => {
								console.log("Notification Saved", doc);
								ngPartneurChat.emit(element + "Notifi", doc);
								console.log("Notification dispatched.");
							});
					}
				});
			});
		});

		// create chat and push in the Chats Array and notify the users that chats is here
		/*
        // sending to all clients in 'game' room except sender
        socket.to('game').emit('nice game', "let's play a game");

        // sending to all clients in 'game1' and/or in 'game2' room, except sender
        socket.to('game1').to('game2').emit('nice game', "let's play a game (too)");
        */

		socket.on("sendMessage", function (message) {
			console.log("Message received:");
			console.log(message);

			let chat = new Chat();
			chat.createdBy = message.createdBy;
			chat.sentTo = message.sentTo;
			chat.message = message.message;
			chat.date = message.date;
			chat.files = message.files;

			chat.save((err, doc) => {
				doc
					.populate("createdBy", "firstName lastName image _id")
					.populate("sentTo", "firstName lastName  image _id")
					.execPopulate((err, doc) => {
						console.log("message Saved", doc);
						Chat.countDocuments({
								sentTo: message.sentTo,
								status: "un-read"
							},
							function (err, c) {
								ngPartneurChat.emit(message.sentTo + "unReadCount", c);
							}
						);
						ngPartneurChat.emit(message.sentTo + "Msg", doc);
						console.log("Message dispatched.");
					});
			});
			// save the messgae to db
			// and dispatch to user with respect to user.ID
		});

		socket.on("disconnect", function () {
			console.log("Got disconnect!");
		});
	});
};