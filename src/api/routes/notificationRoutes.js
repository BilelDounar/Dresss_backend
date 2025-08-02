const express = require('express');
const router = express.Router();

const {
    getUserNotifications,
    markAsSeen,
} = require('../controllers/notificationController');

// Liste des notifications d'un utilisateur
router.get('/user/:id', getUserNotifications);

// Marquer une notification comme lue
router.patch('/:notifId/seen', markAsSeen);

module.exports = router;
