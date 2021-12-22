const mongoose = require("mongoose");
const slug = require("slug");
const mongoosePaginate = require("mongoose-paginate-v2");

const ImageSchema = new mongoose.Schema(
	{
		slug: { type: String, lowercase: true, unique: true },

		fileName: { type: String, default: null },
		URL: { type: String, default: null },
		size: { type: Number, default: null },
		ext: { type: String, default: null },

		chatID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		friendID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{ timestamps: true }
);

ImageSchema.plugin(mongoosePaginate);

ImageSchema.pre("validate", function (next) {
	if (!this.slug) {
		this.slugify();
	}
	next();
});

ImageSchema.methods.slugify = function () {
	this.slug = slug(((Math.random() * Math.pow(36, 6)) | 0).toString(36));
};

module.exports = mongoose.model("Image", ImageSchema);
