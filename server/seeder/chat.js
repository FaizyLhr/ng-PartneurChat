const Friend = require("../models/Friend");
const Chat = require("../models/Chat");
const faker = require("faker");

async function seedChat() {
	const getFriend = await Friend.find();

	for (let i = 0, j = 20; j >= 0, i < 21; i++, j--) {
		let chat = new Chat();

		chat.friendID = getFriend[i]._id;
		chat.sender = getFriend[i].user1;
		chat.receiver = getFriend[i].user2;
		chat.text = faker.lorem.words();
		chat.audio = faker.datatype.string();
		chat.image = faker.datatype.string();
		chat.video = faker.datatype.string();

		await chat.save();
	}

	console.log("Chats Seeded");
}
module.exports = seedChat;
