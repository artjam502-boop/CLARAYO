import mongoose from 'mongoose';
const item = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }, productName: { type: String, required: true }, image: String,
  unitPrice: { type: Number, required: true }, quantity: { type: Number, required: true, min: 1 }, subtotal: { type: Number, required: true }
  , selectedSize: { type: String, trim: true }
}, { _id: false });
const fulfillment = new mongoose.Schema({ seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, enum: ['processing','packed','shipped','delivered','cancelled'], default: 'processing' } }, { _id: false });
const schema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true }, customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [item], required: true }, shippingAddress: { name: String, phone: String, line1: String, city: String, province: String, postalCode: String },
  subtotal: { type: Number, required: true }, shippingFee: { type: Number, required: true }, total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod'], default: 'cod' }, paymentStatus: { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
  status: { type: String, enum: ['processing','packed','partially-shipped','shipped','delivered','cancelled'], default: 'processing', index: true },
  fulfillments: [fulfillment], idempotencyKey: { type: String, sparse: true, unique: true }
}, { timestamps: true });
export default mongoose.model('Order', schema);

