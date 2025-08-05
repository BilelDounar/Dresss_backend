const express = require('express');
const router = express.Router();
const {
    createSave,
    deleteSave,
    checkSaved,
    getSavedItems,
} = require('../controllers/saveController');

// POST create
router.post('/', createSave);
// DELETE unsave
router.delete('/', deleteSave);
// GET status
router.get('/status/:userId/:itemId/:itemType', checkSaved);
// GET user saved items
router.get('/user/:userId', getSavedItems);

module.exports = router;
