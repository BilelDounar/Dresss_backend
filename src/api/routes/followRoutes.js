const express = require('express');
const router = express.Router();

const {
    followUser,
    unfollowUser,
    isFollowing,
} = require('../controllers/followController');

// POST body: { follower, followed }
router.post('/', followUser);

// DELETE body: { follower, followed }
router.delete('/', unfollowUser);

// GET /status?follower=..&followed=..
router.get('/status', isFollowing);

module.exports = router;
