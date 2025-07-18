const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
        },
        user: {
            type: String,
            required: true
        },
        urlsPhotos: [{ type: String }]
    },
    {
        timestamps: {
            createdAt: 'dateCreation',
            updatedAt: 'dateEdition',
        },
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

publicationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

module.exports = mongoose.model('Publication', publicationSchema);
