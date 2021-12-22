const Friend = require("../models/Friend");
const User = require("../models/User");

async function seedFriend() {
	const getUser = await User.find({ role: 2 });

	for (let i = 0, j = 20; j >= 0, i < 21; i++, j--) {
		let friend = new Friend();

		friend.user1 = getUser[i]._id;
		friend.user2 = getUser[j]._id;

		friend.status = 1;
		friend.lastMessage = getUser[i]._id;
		getUser.forEach((e) => {
			friend.chatMessages.push(e._id);
		});
		getUser.forEach((e) => {
			friend.favorites.push(e._id);
		});
		getUser.forEach((e) => {
			friend.images.push(e._id);
		});
		getUser.forEach((e) => {
			friend.audios.push(e._id);
		});
		getUser.forEach((e) => {
			friend.videos.push(e._id);
		});
		friend.currentStatus = 2;

		await friend.save();
	}

	console.log("Friends Seeded");
}
module.exports = seedFriend;
