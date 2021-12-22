const User = require("../models/User");

async function seedUser() {
	// Seed Admin
	{
		let newUser = new User();

		newUser.email = "admin@gmail.com";
		newUser.role = 1;
		newUser.username = "admin";

		newUser.setPassword("faizy");
		newUser.isEmailVerified = true;

		await newUser.save();
	}
	// Seed User
	{
		let newUser = new User();

		newUser.email = "user@gmail.com";
		newUser.username = "user";

		newUser.setPassword("faizy");
		newUser.isEmailVerified = true;

		await newUser.save();
	}

	console.log("Default Users Seeded");
}

module.exports = seedUser;
