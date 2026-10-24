import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/wishlist', allow('customer'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({ path: 'wishlist', populate: [{ path: 'category', select: 'name slug' }, { path: 'store', select: 'storeName slug' }] });
    res.json({ success: true, data: user.wishlist });
  } catch (error) { next(error); }
});

router.post('/wishlist/:productId', allow('customer'), async (req, res, next) => {
  try {
    if (!await Product.exists({ _id: req.params.productId, status: 'active' })) return res.status(404).json({ success: false, message: 'Product not found' });
    await User.updateOne({ _id: req.user.id }, { $addToSet: { wishlist: req.params.productId } });
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) { next(error); }
});

router.delete('/wishlist/:productId', allow('customer'), async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user.id }, { $pull: { wishlist: req.params.productId } });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) { next(error); }
});

router.patch('/password', allow('customer', 'seller', 'admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!await bcrypt.compare(req.body.currentPassword || '', user.passwordHash)) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    if (!req.body.newPassword || req.body.newPassword.length < 8 || req.body.newPassword.length > 16) return res.status(422).json({ success: false, message: 'New password must be 8 to 16 characters' });
    user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) { next(error); }
});

export default router;
