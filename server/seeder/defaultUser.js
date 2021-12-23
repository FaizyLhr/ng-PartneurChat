const User = require("../models/User");

async function seedUser() {
	// Seed Sender
	{
		let newUser = new User();

		newUser.email = "sender@gmail.com";
		newUser.username = "sender";

		newUser.setPassword("1234");
		newUser.isEmailVerified = true;

		await newUser.save();
	}
	// Seed Receiver
	{
		let newUser = new User();

		newUser.email = "receiver@gmail.com";
		newUser.username = "receiver";

		newUser.setPassword("1234");
		newUser.isEmailVerified = true;

		await newUser.save();
	}

	console.log("Default Users Seeded");
}

module.exports = seedUser;