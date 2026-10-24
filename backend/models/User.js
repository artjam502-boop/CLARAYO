import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer','seller','admin'], default: 'customer' },
  phone: { type: String, trim: true, default: '' },
  address: { line1: String, city: String, province: String, postalCode: String },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  followedStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
  accountStatus: { type: String, enum: ['active','suspended'], default: 'active' }
}, { timestamps: true });
schema.set('toJSON', { transform: (_, value) => { delete value.passwordHash; return value; } });
export default mongoose.model('User', schema);

