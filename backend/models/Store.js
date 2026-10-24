import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' }, logo: String, banner: String,
  approvalStatus: { type: String, enum: ['pending','approved','rejected','suspended'], default: 'pending', index: true }
}, { timestamps: true });
export default mongoose.model('Store', schema);

