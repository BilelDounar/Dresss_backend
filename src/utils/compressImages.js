const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Assure que le dossier uploads existe
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Middleware pour compresser les images JPG et PNG chargées par Multer (en mémoire).
 *  - Conserve le format d'origine (pas de conversion WebP/AVIF).
 *  - Réduit considérablement la taille tout en gardant la qualité visuelle.
 *  - Génère un nom de fichier unique et enregistre le fichier compressé sur disque.
 *
 * Après exécution, chaque objet fichier dans `req.files` contient :
 *   - filename : nom du fichier compressé enregistré sur disque
 *   - path     : chemin absolu sur disque (peut servir en interne)
 */
module.exports = async (req, res, next) => {
    try {
        if (!req.files) return next();

        // Champs gérés
        const fields = ['publicationPhoto', 'articlePhotos'];

        for (const field of fields) {
            if (!req.files[field]) continue;

            req.files[field] = await Promise.all(
                req.files[field].map(async file => {
                    // Construction d'un nom de fichier lisible → publicationId-userId-type-date-random.ext
                    const publicationId = (req.body.publicationId || req.params?.id || '').toString();
                    const userId = (req.body.userId || 'unknown').toString();
                    const type = file.fieldname === 'publicationPhoto' ? 'photo' : 'article';
                    const date = new Date().toISOString().replace(/[:.]/g, '-');
                    const random = crypto.randomBytes(3).toString('hex'); // 6 caractères aléatoires
                    const ext = path.extname(file.originalname).toLowerCase(); // .jpg ou .png
                    const filename = publicationId
                        ? `${publicationId}-${userId}-${type}-${date}-${random}${ext}`
                        : `${userId}-${type}-${date}-${random}${ext}`;
                    const fullPath = path.join(uploadsDir, filename);

                    // Pipeline sharp
                    let pipeline = sharp(file.buffer).rotate(); // corrige l'orientation EXIF
                    if (ext === '.png') {
                        pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
                    } else {
                        pipeline = pipeline.jpeg({ mozjpeg: true, quality: 82 });
                    }

                    // Écriture du fichier compressé
                    await pipeline.toFile(fullPath);

                    // Retourne un objet fichier compatible avec le contrôleur existant
                    return {
                        ...file,
                        filename,          // utilisé plus tard pour générer l'URL publique
                        path: fullPath,    // chemin absolu (optionnel)
                    };
                })
            );
        }

        return next();
    } catch (err) {
        console.error('Erreur dans compressImages middleware:', err);
        return next(err);
    }
};
