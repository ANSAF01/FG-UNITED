const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String,
        required: true
    }],
    status: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexing
productSchema.index({ name: 1, isDeleted: 1 });
productSchema.index({ category: 1, isDeleted: 1 });
productSchema.index({ brand: 1, isDeleted: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

// Virtual image URL
productSchema.virtual('imageUrl').get(function() {
    return this.images && this.images.length > 0 ? this.images[0] : '/images/placeholder.jpg';
});

module.exports = mongoose.model('Product', productSchema);