let router = require("express").Router();

router.use("/users", require("./users"));
router.use("/chats", require("./chat"));
router.use("/friends", require("./friend"));
router.use("/images", require("./image"));
router.use("/audios", require("./audios"));
router.use("/videos", require("./videos"));

module.exports = router;