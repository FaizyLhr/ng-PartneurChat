const Friend = require("../models/Friend");
const User = require("../models/User");

async function seedFriend() {
	const getUser = await User.find({});

	for (let i = 0, j = 20; j >= 0, i < 21; i++, j--) {
		let friend = new Friend();

		friend.user1 = getUser[0]._id;
		friend.user2 = getUser[1]._id;
		friend.status = 1;

		await friend.save();
	}

	console.log("Friends Seeded");
}
module.exports = seedFriend;