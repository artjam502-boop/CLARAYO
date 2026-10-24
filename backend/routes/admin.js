import {Router} from 'express'; import User from '../models/User.js'; import Store from '../models/Store.js'; import Product from '../models/Product.js'; import Order from '../models/Order.js'; import {protect,allow} from '../middleware/auth.js';
const router=Router();router.use(protect,allow('admin'));
router.get('/dashboard',async(req,res,next)=>{
  try{
    const dateGroup={format:'%Y-%m-%d',date:'$createdAt',timezone:'Asia/Manila'};
    const [customers,sellers,pending,products,orders,revenue,orderActivity,customerActivity,productActivity,pendingActivity]=await Promise.all([
      User.countDocuments({role:'customer'}),
      User.countDocuments({role:'seller',accountStatus:'active'}),
      Store.countDocuments({approvalStatus:'pending'}),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{$match:{status:'delivered'}},{$group:{_id:null,total:{$sum:'$total'}}}]),
      Order.aggregate([{$match:{status:'delivered'}},{$group:{_id:{$dateToString:dateGroup},revenue:{$sum:'$total'},orders:{$sum:1}}},{$sort:{_id:1}}]),
      User.aggregate([{$match:{role:'customer'}},{$group:{_id:{$dateToString:dateGroup},value:{$sum:1}}},{$sort:{_id:1}}]),
      Product.aggregate([{$group:{_id:{$dateToString:dateGroup},value:{$sum:1}}},{$sort:{_id:1}}]),
      Store.aggregate([{$match:{approvalStatus:'pending'}},{$group:{_id:{$dateToString:dateGroup},value:{$sum:1}}},{$sort:{_id:1}}])
    ]);
    const recent={
      revenue:orderActivity.map(day=>({_id:day._id,value:day.revenue})),
      orders:orderActivity.map(day=>({_id:day._id,value:day.orders})),
      customers:customerActivity,
      products:productActivity,
      pending:pendingActivity
    };
    res.json({success:true,data:{customers,sellers,pending,products,orders,revenue:revenue[0]?.total||0,recent}});
  }catch(e){next(e)}
});
const paged=model=>async(req,res,next)=>{try{const page=Math.max(+req.query.page||1,1),limit=20,q={};if(req.query.search)q.$or=[{name:new RegExp(req.query.search,'i')},{email:new RegExp(req.query.search,'i')}];const [items,total]=await Promise.all([model.find(q).sort('-createdAt').skip((page-1)*limit).limit(limit),model.countDocuments(q)]);res.json({success:true,data:items,pagination:{page,total,pages:Math.ceil(total/limit)}})}catch(e){next(e)}};
router.get('/customers',async(req,res,next)=>{try{res.json({success:true,data:await User.find({role:{$in:['customer','seller']}}).sort('-createdAt')})}catch(e){next(e)}});router.get('/sellers',async(req,res,next)=>{try{res.json({success:true,data:await Store.find().populate('seller','name email accountStatus').sort('-createdAt')})}catch(e){next(e)}});router.get('/seller-applications',async(req,res,next)=>{try{res.json({success:true,data:await Store.find({approvalStatus:'pending'}).populate('seller','name email').sort('createdAt')})}catch(e){next(e)}});
router.patch('/seller-applications/:id',async(req,res,next)=>{try{if(!['approved','rejected','suspended'].includes(req.body.status))return res.status(422).json({success:false,message:'Invalid decision'});const store=await Store.findByIdAndUpdate(req.params.id,{approvalStatus:req.body.status},{new:true});if(!store)return res.status(404).json({success:false,message:'Application not found'});if(req.body.status==='approved')await User.findByIdAndUpdate(store.seller,{role:'seller'});await store.populate('seller','name email accountStatus');res.json({success:true,data:store})}catch(e){next(e)}});
router.get('/products',paged(Product));router.get('/orders',async(req,res,next)=>{try{res.json({success:true,data:await Order.find().populate('customer','name email').sort('-createdAt')})}catch(e){next(e)}});router.patch('/users/:id/status',async(req,res,next)=>{try{const u=await User.findByIdAndUpdate(req.params.id,{accountStatus:req.body.status},{new:true});res.json({success:true,data:u})}catch(e){next(e)}});
router.get('/reports',async(req,res,next)=>{
  try{
    const month={$dateToString:{format:'%Y-%m',date:'$createdAt',timezone:'Asia/Manila'}};
    const [summary,sellerIncome]=await Promise.all([
      Order.aggregate([{$match:{status:'delivered'}},{$group:{_id:month,revenue:{$sum:'$total'},orders:{$sum:1}}},{$sort:{_id:1}}]),
      Order.aggregate([
        {$match:{status:'delivered'}},{$unwind:'$items'},
        {$group:{_id:{month,seller:'$items.seller',store:'$items.store'},income:{$sum:'$items.subtotal'},units:{$sum:'$items.quantity'},orders:{$addToSet:'$_id'}}},
        {$lookup:{from:'users',localField:'_id.seller',foreignField:'_id',as:'seller'}},
        {$lookup:{from:'stores',localField:'_id.store',foreignField:'_id',as:'store'}},
        {$project:{_id:0,month:'$_id.month',sellerId:'$_id.seller',sellerName:{$ifNull:[{$arrayElemAt:['$seller.name',0]},'Unknown seller']},storeName:{$ifNull:[{$arrayElemAt:['$store.storeName',0]},'Unknown store']},income:1,units:1,orders:{$size:'$orders'}}},
        {$sort:{month:1,income:-1}}
      ])
    ]);
    const data=summary.map(report=>({...report,sellers:sellerIncome.filter(item=>item.month===report._id)}));
    res.json({success:true,data});
  }catch(e){next(e)}
});
export default router;

