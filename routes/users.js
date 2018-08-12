let express = require('express');
let router = express.Router();

let authenticateController = require('../controllers/authenticate-controller');
let registerController = require('../controllers/register-controller');

router.post('/register', registerController.register);
router.post('/authenticate', authenticateController.authenticate);

module.exports = router;