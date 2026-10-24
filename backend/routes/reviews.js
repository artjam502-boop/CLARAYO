import { Router } from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, allow } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = Router();
router.get('/order/:orderId', protect, allow('customer', 'seller'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(400).json({ success: false, message: 'Invalid order' });
    const order = await Order.findOne({ _id: req.params.orderId, customer: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const reviews = await Review.find({ order: order.id, customer: req.user.id }).select('product rating comment createdAt');
    res.json({ success: true, data: reviews });
  } catch (error) { next(error); }
});
router.get('/product/:productId', async (req, res, next) => {
  try { res.json({ success: true, data: await Review.find({ product: req.params.productId }).populate('customer', 'name').sort('-createdAt') }); }
  catch (error) { next(error); }
});
router.post('/', protect, allow('customer', 'seller'), async (req, res, next) => {
  try {
    const { order: orderId, product: productId, rating, comment } = req.body;
    if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid order or product' });
    }
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!String(comment || '').trim()) {
      return res.status(400).json({ success: false, message: 'Review comment is required' });
    }
    const order = await Order.findOne({ _id: orderId, customer: req.user.id, status: 'delivered', 'items.product': productId });
    if (!order) return res.status(403).json({ success: false, message: 'Only delivered purchases can be reviewed' });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product no longer exists' });
    const existing = await Review.findOne({ customer: req.user.id, product: productId, order: order.id });
    if (existing) return res.status(409).json({ success: false, message: 'You already reviewed this product for this order' });
    const review = await Review.create({ customer: req.user.id, product: productId, order: order.id, rating: numericRating, comment: String(comment).trim() });
    const stats = await Review.aggregate([{ $match: { product: review.product } }, { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } }]);
    if (stats.length) await Product.updateOne({ _id: review.product }, { rating: stats[0].rating, reviewCount: stats[0].count });
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
});
router.put('/:id', protect, allow('customer', 'seller'), async (req, res, next) => {
  try { const review = await Review.findOneAndUpdate({ _id: req.params.id, customer: req.user.id }, { rating: req.body.rating, comment: req.body.comment }, { new: true, runValidators: true }); if (!review) return res.status(404).json({ success: false, message: 'Review not found' }); res.json({ success: true, data: review }); }
  catch (error) { next(error); }
});
export default router;
