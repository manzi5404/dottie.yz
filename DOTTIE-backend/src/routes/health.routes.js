const express = require('express');

const router = express.Router();

// GET / → "DOTTIE Backend Running"
// Note: This route is NOT wired into the current server.js yet.
router.get('/', (req, res) => {
  res.status(200).json({ status: 'DOTTIE Backend Running' });
});

module.exports = router;

