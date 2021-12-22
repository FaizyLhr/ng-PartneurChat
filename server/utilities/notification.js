const NotificationModel = require("../models/Notification");

const sendNotification = ({ title, type, sentTo, user = null, data = {} }) => {
	// console.log("with socket");
	// allSportsSocket.emit("notification" + sentTo);

	// console.log("socket");

	new NotificationModel({
		title,
		type,
		user,
		sentTo,
		data,
	})
		.save()
		.then((doc) => {
			// TODO check here if user is online
		})
		.catch((err) => {
			return console.log(err);
		});
	// console.log("done");
};

module.exports = {
	sendNotification,
};
