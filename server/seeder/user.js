const faker = require("faker");
const User = require("../models/User");

async function seedUser() {
	// User Seeder
	for (let i = 0; i < 20; i++) {
		let newUser = new User();

		newUser.email = faker.internet.email();
		newUser.username = faker.lorem.word(5);

		newUser.setPassword(faker.datatype.string());
		newUser.isEmailVerified = faker.datatype.boolean();

		await newUser.save();
	}

	console.log("Users Seeded");
}

module.exports = seedUser;
