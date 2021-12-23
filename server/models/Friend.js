const mongoose = require("mongoose");
const slug = require("slug");
const mongoosePaginate = require("mongoose-paginate-v2");
const uniqueValidator = require("mongoose-unique-validator");

const FriendsSchema = new mongoose.Schema({
	slug: {
		type: String,
		lowercase: true,
		unique: true
	},
	user1: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	user2: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	status: {
		type: Number,
		default: 1,
		enum: [
			1, // 1: Friend
			2, // 2: Unfriend
		],
	},
	lastMessage: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Chat",
	},
	chatMessages: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Chat",
	}, ],
	isVisited: {
		type: Boolean,
		default: false
	},
	favorites: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Chat",
	}, ],
	images: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Image",
	}, ],
	audios: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Audio",
	}, ],
	videos: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Video",
	}, ],
	currentStatus: {
		type: Number,
		default: 2,
		enum: [
			1, // 1: online
			2, // 2: away
		],
	},
}, {
	timestamps: true
});

FriendsSchema.plugin(mongoosePaginate);
// FriendsSchema.plugin(uniqueValidator, { message: "is already taken." });

FriendsSchema.pre("validate", function (next) {
	if (!this.slug) {
		this.slugify();
	}
	next();
});

FriendsSchema.methods.slugify = function () {
	this.slug = slug(((Math.random() * Math.pow(36, 6)) | 0).toString(36));
};

module.exports = mongoose.model("Friend", FriendsSchema);