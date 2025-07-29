const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Fonction pour générer un token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Inscrire un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
        }

        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    status: user.status,
                },
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    status: user.status,
                },
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
