import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, rating: { type: Number, required: true, min: 1, max: 5 }, comment: { type: String, maxlength: 1000 }
}, { timestamps: true });
schema.index({ customer: 1, product: 1, order: 1 }, { unique: true });
export default mongoose.model('Review', schema);

