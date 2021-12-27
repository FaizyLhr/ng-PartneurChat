const mongoose = require("mongoose");
const slug = require("slug");
const mongoosePaginate = require("mongoose-paginate-v2");

const ChatGroupSchema = new mongoose.Schema(
	{
		slug: {
			type: String,
			lowercase: true,
			unique: true,
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
			default: null,
		},
		chatMessages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Chat",
			},
		],
		isVisited: {
			type: Boolean,
			default: false,
		},
		favorites: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Chat",
			},
		],
		images: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Image",
			},
		],
		audios: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Audio",
			},
		],
		videos: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Video",
			},
		],
		unReadCount: { type: Number, default: 0 },
		currentStatus: {
			type: Number,
			default: 2,
			enum: [
				1, // 1: online
				2, // 2: away
			],
		},
	},
	{ timestamps: true }
);

ChatGroupSchema.plugin(mongoosePaginate);
// ChatGroupSchema.plugin(uniqueValidator, { message: "is already taken." });

ChatGroupSchema.pre("validate", function (next) {
	if (!this.slug) {
		this.slugify();
	}
	next();
});

ChatGroupSchema.methods.slugify = function () {
	this.slug = slug(((Math.random() * Math.pow(36, 6)) | 0).toString(36));
};

module.exports = mongoose.model("Friend", ChatGroupSchema);
