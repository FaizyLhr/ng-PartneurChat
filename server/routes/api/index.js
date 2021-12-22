let router = require("express").Router();

router.use("/", require("./users"));
router.use("/", require("./chat"));
router.use("/", require("./friend"));
router.use("/", require("./image"));
router.use("/", require("./audios"));
router.use("/", require("./videos"));

module.exports = router;
