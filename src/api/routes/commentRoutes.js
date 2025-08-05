const express = require('express');
const router = express.Router();

const { createComment, getComments } = require('../controllers/commentController');

// Ajouter un commentaire
router.post('/', createComment);

// Récupérer les commentaires d'une publication
router.get('/:postId', getComments);

module.exports = router;
