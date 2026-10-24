import 'dotenv/config';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

await connectDB();

const demoEmail = 'seller@clarayo.local';
const demoSkus = ['SS-WH-001', 'SS-DL-002', 'SS-CT-003'];
const demoCategorySlugs = ['electronics', 'home-living', 'fashion', 'beauty'];

const demoSeller = await User.findOne({ email: demoEmail });
const productResult = await Product.deleteMany({
  $or: [
    { sku: { $in: demoSkus } },
    ...(demoSeller ? [{ seller: demoSeller._id }] : []),
  ],
});

let storesDeleted = 0;
let usersDeleted = 0;
if (demoSeller) {
  storesDeleted = (await Store.deleteMany({ seller: demoSeller._id })).deletedCount;
  usersDeleted = (await User.deleteOne({ _id: demoSeller._id })).deletedCount;
}

let categoriesDeleted = 0;
for (const slug of demoCategorySlugs) {
  const category = await Category.findOne({ slug });
  if (category && !(await Product.exists({ category: category._id }))) {
    await Category.deleteOne({ _id: category._id });
    categoriesDeleted += 1;
  }
}

console.log(JSON.stringify({
  productsDeleted: productResult.deletedCount,
  storesDeleted,
  usersDeleted,
  categoriesDeleted,
  preservedAdmin: Boolean(await User.exists({ role: 'admin' })),
  remaining: {
    users: await User.countDocuments(),
    stores: await Store.countDocuments(),
    products: await Product.countDocuments(),
    categories: await Category.countDocuments(),
  },
}, null, 2));

process.exit(0);
