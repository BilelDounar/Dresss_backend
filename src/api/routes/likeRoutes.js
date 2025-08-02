const express = require('express');
const router = express.Router();

const {
    likePost,
    unlikePost,
    isLiked,
    countLikes,
} = require('../controllers/likeController');

// Créer un like
router.post('/', likePost);

// Supprimer un like
router.delete('/', unlikePost);

// Vérifier si liké
router.get('/status', isLiked);

// Compter les likes d'un post
router.get('/count', countLikes);

module.exports = router;
