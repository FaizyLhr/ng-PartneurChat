const mongoose = require("mongoose");
const slug = require("slug");
const mongoosePaginate = require("mongoose-paginate-v2");

const ChatSchema = new mongoose.Schema(
	{
		slug: { type: String, lowercase: true, unique: true },
		chatGroupID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ChatGroup",
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		receiver: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		reply: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
		},
		isRead: { type: Boolean, default: false },
		isDeleted: { type: Boolean, default: false },
		// isDeleted: [
		// 	{
		// 		type: mongoose.Schema.Types.ObjectId,
		// 		ref: "User",
		// 	},
		// ],
		text: { type: String, default: null },
		audios: { type: Array, default: null },
		images: { type: Array, default: null },
		videos: { type: Array, default: null },
		date: {
			type: Date,
			default: Date.now(),
		},
		isFav: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

ChatSchema.plugin(mongoosePaginate);

ChatSchema.pre("validate", function (next) {
	if (!this.slug) {
		this.slugify();
	}
	next();
});

ChatSchema.methods.slugify = function () {
	this.slug = slug(((Math.random() * Math.pow(36, 6)) | 0).toString(36));
};

module.exports = mongoose.model("Chat", ChatSchema);
