import { Router } from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.get('/product/:productId', async (req, res, next) => {
  try { res.json({ success: true, data: await Review.find({ product: req.params.productId }).populate('customer', 'name').sort('-createdAt') }); }
  catch (error) { next(error); }
});
router.post('/', protect, allow('customer', 'seller'), async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.body.order, customer: req.user.id, status: 'delivered', 'items.product': req.body.product });
    if (!order) return res.status(403).json({ success: false, message: 'Only delivered purchases can be reviewed' });
    const review = await Review.create({ customer: req.user.id, product: req.body.product, order: order.id, rating: req.body.rating, comment: req.body.comment });
    const stats = await Review.aggregate([{ $match: { product: review.product } }, { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } }]);
    await Product.updateOne({ _id: review.product }, { rating: stats[0].rating, reviewCount: stats[0].count });
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
});
router.put('/:id', protect, allow('customer', 'seller'), async (req, res, next) => {
  try { const review = await Review.findOneAndUpdate({ _id: req.params.id, customer: req.user.id }, { rating: req.body.rating, comment: req.body.comment }, { new: true, runValidators: true }); if (!review) return res.status(404).json({ success: false, message: 'Review not found' }); res.json({ success: true, data: review }); }
  catch (error) { next(error); }
});
export default router;
