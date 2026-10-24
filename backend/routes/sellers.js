import {Router} from 'express'; import slugify from 'slugify'; import Store from '../models/Store.js'; import Product from '../models/Product.js'; import Order from '../models/Order.js'; import User from '../models/User.js'; import Review from '../models/Review.js'; import {protect,allow} from '../middleware/auth.js';
const router=Router();
router.get('/public/:slug',async(req,res,next)=>{try{const store=await Store.findOne({slug:req.params.slug,approvalStatus:'approved'}).populate('seller','name');if(!store)return res.status(404).json({success:false,message:'Store not found'});const products=await Product.find({store:store._id,status:'active'}).populate('category','name slug').populate('store','storeName slug').sort('-featured -createdAt');const reviewCount=products.reduce((sum,p)=>sum+(p.reviewCount||0),0),ratingTotal=products.reduce((sum,p)=>sum+(p.rating||0)*(p.reviewCount||0),0),followers=await User.countDocuments({followedStores:store._id});res.json({success:true,data:{store,products,stats:{rating:reviewCount?ratingTotal/reviewCount:0,reviews:reviewCount,followers,products:products.length}}})}catch(e){next(e)}});
router.use(protect);
router.post('/apply',allow('customer'),async(req,res,next)=>{try{if(await Store.exists({seller:req.user.id}))return res.status(409).json({success:false,message:'Application already exists'});const store=await Store.create({...req.body,seller:req.user.id,slug:`${slugify(req.body.storeName,{lower:true,strict:true})}-${Date.now().toString(36)}`});res.status(201).json({success:true,data:store})}catch(e){next(e)}});
router.get('/store',async(req,res,next)=>{try{const store=await Store.findOne({seller:req.user.id});res.json({success:true,data:store})}catch(e){next(e)}});
router.put('/store',allow('seller'),async(req,res,next)=>{try{const {storeName,description,logo,banner}=req.body;const store=await Store.findOneAndUpdate({seller:req.user.id},{storeName,description,logo,banner},{new:true,runValidators:true});res.json({success:true,data:store})}catch(e){next(e)}});
router.get('/dashboard',allow('seller'),async(req,res,next)=>{
  try{
    const seller=req.user._id,dateGroup={format:'%Y-%m-%d',date:'$createdAt',timezone:'Asia/Manila'},updatedDateGroup={format:'%Y-%m-%d',date:'$updatedAt',timezone:'Asia/Manila'};
    const [products,lowStock,orders,sales,orderActivity,productActivity,lowStockActivity,statusActivity]=await Promise.all([
      Product.countDocuments({seller}),
      Product.countDocuments({seller,stock:{$lte:5}}),
      Order.countDocuments({'items.seller':seller}),
      Order.aggregate([{$match:{status:{$ne:'cancelled'}}},{$unwind:'$items'},{$match:{'items.seller':seller}},{$group:{_id:null,total:{$sum:'$items.subtotal'}}}]),
      Order.aggregate([{$match:{status:{$ne:'cancelled'},'items.seller':seller}},{$unwind:'$items'},{$match:{'items.seller':seller}},{$group:{_id:{$dateToString:dateGroup},revenue:{$sum:'$items.subtotal'},orders:{$addToSet:'$_id'}}},{$project:{_id:1,revenue:1,orders:{$size:'$orders'}}},{$sort:{_id:1}}]),
      Product.aggregate([{$match:{seller}},{$group:{_id:{$dateToString:dateGroup},value:{$sum:1}}},{$sort:{_id:1}}]),
      Product.aggregate([{$match:{seller,stock:{$lte:5}}},{$group:{_id:{$dateToString:updatedDateGroup},value:{$sum:1}}},{$sort:{_id:1}}]),
      Order.aggregate([{$match:{'fulfillments.seller':seller}},{$unwind:'$fulfillments'},{$match:{'fulfillments.seller':seller,'fulfillments.status':{$ne:'cancelled'}}},{$group:{_id:{date:{$dateToString:dateGroup},status:'$fulfillments.status'},value:{$sum:1}}},{$sort:{'_id.date':1}}])
    ]);
    const statusSeries=statuses=>statusActivity.filter(day=>statuses.includes(day._id.status)).reduce((days,day)=>{const existing=days.find(item=>item._id===day._id.date);if(existing)existing.value+=day.value;else days.push({_id:day._id.date,value:day.value});return days},[]);
    const statusTotal=statuses=>statusActivity.filter(day=>statuses.includes(day._id.status)).reduce((total,day)=>total+day.value,0);
    const recent={
      revenue:orderActivity.map(day=>({_id:day._id,value:day.revenue})),
      orders:orderActivity.map(day=>({_id:day._id,value:day.orders})),
      products:productActivity,
      lowStock:lowStockActivity,
      pendingOrders:statusSeries(['processing','packed']),
      shippedOrders:statusSeries(['shipped']),
      deliveredOrders:statusSeries(['delivered'])
    };
    res.json({success:true,data:{products,lowStock,orders,sales:sales[0]?.total||0,pendingOrders:statusTotal(['processing','packed']),shippedOrders:statusTotal(['shipped']),deliveredOrders:statusTotal(['delivered']),recent}});
  }catch(e){next(e)}
});
router.get('/products',allow('seller'),async(req,res,next)=>{try{res.json({success:true,data:await Product.find({seller:req.user.id}).populate('category','name').sort('-createdAt')})}catch(e){next(e)}});
router.get('/inventory',allow('seller'),async(req,res,next)=>{try{res.json({success:true,data:await Product.find({seller:req.user.id}).populate('category','name').sort('stock')})}catch(e){next(e)}});
router.get('/followers',allow('seller'),async(req,res,next)=>{try{const store=await Store.findOne({seller:req.user.id,approvalStatus:'approved'});if(!store)return res.json({success:true,data:[]});const followers=await User.find({followedStores:store._id,accountStatus:'active'}).select('name email role createdAt').sort('name');res.json({success:true,data:followers})}catch(e){next(e)}});
router.get('/reviews',allow('seller'),async(req,res,next)=>{try{const products=await Product.find({seller:req.user.id}).select('_id');const reviews=await Review.find({product:{$in:products.map(product=>product._id)}}).populate('customer','name email').populate('product','name images sku').sort('-createdAt');res.json({success:true,data:reviews})}catch(e){next(e)}});
router.delete('/followers/:userId',allow('seller'),async(req,res,next)=>{try{const store=await Store.findOne({seller:req.user.id,approvalStatus:'approved'});if(!store)return res.status(404).json({success:false,message:'Store not found'});const result=await User.updateOne({_id:req.params.userId,followedStores:store._id},{$pull:{followedStores:store._id}});if(!result.modifiedCount)return res.status(404).json({success:false,message:'Follower not found'});res.json({success:true,message:'Follower removed'})}catch(e){next(e)}});
router.get('/settings',allow('seller'),async(req,res,next)=>{try{res.json({success:true,data:await Store.findOne({seller:req.user.id})})}catch(e){next(e)}});
router.get('/orders',allow('seller'),async(req,res,next)=>{try{const docs=await Order.find({'items.seller':req.user.id}).sort('-createdAt').lean();res.json({success:true,data:docs.map(o=>({...o,items:o.items.filter(i=>String(i.seller)===req.user.id)}))})}catch(e){next(e)}});
router.patch('/orders/:id/status',allow('seller'),async(req,res,next)=>{try{const allowed=['processing','packed','shipped','delivered'];if(!allowed.includes(req.body.status))return res.status(422).json({success:false,message:'Invalid status'});const o=await Order.findOne({_id:req.params.id,'fulfillments.seller':req.user.id});if(!o)return res.status(404).json({success:false,message:'Order not found'});o.fulfillments.find(f=>String(f.seller)===req.user.id).status=req.body.status;const statuses=o.fulfillments.map(f=>f.status);if(statuses.every(s=>s==='delivered'))o.status='delivered';else if(statuses.every(s=>s==='shipped'||s==='delivered'))o.status='shipped';else if(statuses.some(s=>s==='shipped'||s==='delivered'))o.status='partially-shipped';else o.status='processing';await o.save();res.json({success:true,data:o})}catch(e){next(e)}});
router.get('/reports',allow('seller'),async(req,res,next)=>{try{const data=await Order.aggregate([{$match:{'items.seller':req.user._id,status:{$ne:'cancelled'}}},{$unwind:'$items'},{$match:{'items.seller':req.user._id}},{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$createdAt'}},sales:{$sum:'$items.subtotal'},units:{$sum:'$items.quantity'}}},{$sort:{_id:1}}]);res.json({success:true,data})}catch(e){next(e)}}); export default router;
