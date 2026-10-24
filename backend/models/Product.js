import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 }, slug: { type: String, required: true, unique: true },
  description: { type: String, required: true, maxlength: 5000 }, price: { type: Number, required: true, min: 0 },
  images: [{ type: String }], category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger }, sku: { type: String, required: true, unique: true, uppercase: true },
  sizes: [{ type: String, trim: true, uppercase: true }],
  featured: { type: Boolean, default: false }, status: { type: String, enum: ['active','draft','archived'], default: 'active', index: true },
  sold: { type: Number, default: 0, min: 0 }, rating: { type: Number, default: 0, min: 0, max: 5 }, reviewCount: { type: Number, default: 0 }
}, { timestamps: true });
schema.index({ name: 'text', description: 'text', sku: 'text' });
export default mongoose.model('Product', schema);

