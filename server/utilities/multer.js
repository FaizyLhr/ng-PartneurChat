const path = require("path");
const multer = require("multer");

const imgStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		console.log(":::::::::::iStorage");
		cb(null, path.join(__dirname + "../../public/uploads/images"));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	},
});

const audioStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname + "../../public/uploads/audios"));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	},
});

const videoStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname + "../../public/uploads/videos"));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	},
});

const imgFileFilter = (req, file, cb) => {
	console.log("mime");
	console.log("mime:::", file.mimetype.toLowerCase());
	if (
		file.mimetype.toLowerCase() === "image/jpeg" ||
		file.mimetype.toLowerCase() === "image/jpg" ||
		file.mimetype.toLowerCase() === "image/png"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const audioFileFilter = (req, file, cb) => {
	if (
		file.mimetype.toLowerCase() === "audio/mpeg" ||
		file.mimetype.toLowerCase() === "audio/mp3" ||
		file.mimetype.toLowerCase() === "audio/wav"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const videoFileFilter = (req, file, cb) => {
	if (file.mimetype.toLowerCase() === "video/mp4") {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		console.log(path.join(__dirname + "../../../public/uploads/images"));
		// console.log(path.join(process.cwd(), "server/public", "uploads"));
		cb(null, path.join(__dirname + "../../public/uploads/images"));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	},
});

const upload = multer({
	storage,
	limits: {
		fileSize: 1024 * 1024 * 30,
	},
	// fileFilter,
});

const iUpload = multer({
	storage: imgStorage,
	limits: {
		fileSize: 1024 * 1024 * 30,
	},
	fileFilter: imgFileFilter,
});

const aUpload = multer({
	storage: audioStorage,
	limits: {
		fileSize: 1024 * 1024 * 30,
	},
	fileFilter: audioFileFilter,
});

const vUpload = multer({
	storage: videoStorage,
	limits: {
		fileSize: 1024 * 1024 * 30,
	},
	fileFilter: videoFileFilter,
});

module.exports = { vUpload, aUpload, iUpload, upload };
