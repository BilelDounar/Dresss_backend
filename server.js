require('dotenv').config(); // Charge les variables d'environnement
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Variables critiques
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI est manquant dans le fichier .env");
    process.exit(1);
}

if (!process.env.NODE_ENV) {
    console.warn("⚠️ NODE_ENV non défini. Valeur par défaut : 'development'");
    process.env.NODE_ENV = 'development';
}

if (!process.env.PORT) {
    console.warn("⚠️ PORT non défini. Valeur par défaut : 5000");
    process.env.PORT = 5000;
}

// Nouvel ajout : HOST pour écouter toutes les interfaces
const HOST = process.env.HOST || '0.0.0.0';

// Connexion à la base de données
connectDB()
    .then(() => {
        const PORT = process.env.PORT;
        app.listen(PORT, HOST, () => {
            console.log(`✅ Serveur lancé en mode ${process.env.NODE_ENV} sur http://${HOST}:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Échec de la connexion à MongoDB :", err.message);
        process.exit(1);
    });
