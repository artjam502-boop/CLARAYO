import {Router} from 'express'; import Order from '../models/Order.js'; import Product from '../models/Product.js'; import {protect} from '../middleware/auth.js';
const router=Router(); router.use(protect);
router.post('/',async(req,res,next)=>{
  const reserved=[];
  try{
    const key=req.get('Idempotency-Key');
    if(key){const existing=await Order.findOne({idempotencyKey:key});if(existing)return res.json({success:true,data:existing})}
    if(!Array.isArray(req.body.items)||!req.body.items.length){const e=new Error('Cart is empty');e.status=422;throw e}
    const ids=req.body.items.map(i=>String(i.product));
    const products=await Product.find({_id:{$in:ids},status:'active'});
    if(products.length!==new Set(ids).size){const e=new Error('One or more products are unavailable');e.status=409;throw e}
    if(req.user.role==='seller'&&products.some(product=>String(product.seller)===req.user.id)){const e=new Error('Sellers cannot purchase their own products');e.status=403;throw e}
    let subtotal=0;const items=[];
    for(const input of req.body.items){
      const p=products.find(x=>String(x._id)===String(input.product)),qty=Number(input.quantity);
      if(!p||!Number.isInteger(qty)||qty<1){const e=new Error('Invalid cart quantity');e.status=422;throw e}
      const updated=await Product.findOneAndUpdate({_id:p._id,status:'active',stock:{$gte:qty}},{$inc:{stock:-qty,sold:qty}},{new:true});
      if(!updated){const e=new Error(`${p.name} does not have enough stock`);e.status=409;throw e}
      reserved.push({product:p._id,quantity:qty});
      const line=p.price*qty;subtotal+=line;
      items.push({product:p.id,seller:p.seller,store:p.store,productName:p.name,image:p.images[0],unitPrice:p.price,quantity:qty,subtotal:line});
    }
    const shippingFee=subtotal>=1500?0:99,sellers=[...new Set(items.map(i=>String(i.seller)))];
    const created=await Order.create({orderNumber:`SS-${Date.now()}-${Math.floor(Math.random()*900+100)}`,customer:req.user.id,items,shippingAddress:req.body.shippingAddress,subtotal,shippingFee,total:subtotal+shippingFee,fulfillments:sellers.map(seller=>({seller,status:'processing'})),idempotencyKey:key});
    res.status(201).json({success:true,data:created});
  }catch(e){
    if(e.code===11000&&req.get('Idempotency-Key')){const existing=await Order.findOne({idempotencyKey:req.get('Idempotency-Key')});if(existing)return res.json({success:true,data:existing})}
    if(reserved.length)await Promise.allSettled(reserved.map(i=>Product.updateOne({_id:i.product},{$inc:{stock:i.quantity,sold:-i.quantity}})));
    next(e);
  }
});
router.get('/my-orders',async(req,res,next)=>{try{res.json({success:true,data:await Order.find({customer:req.user.id}).sort('-createdAt')})}catch(e){next(e)}});
router.get('/:id',async(req,res,next)=>{try{const q={_id:req.params.id};if(req.user.role==='customer')q.customer=req.user.id;else if(req.user.role==='seller')q.$or=[{customer:req.user.id},{'items.seller':req.user.id}];const o=await Order.findOne(q).populate('items.product','name images');if(!o)return res.status(404).json({success:false,message:'Order not found'});res.json({success:true,data:o})}catch(e){next(e)}});
router.patch('/:id/cancel',async(req,res,next)=>{try{const order=await Order.findOneAndUpdate({_id:req.params.id,customer:req.user.id,status:'processing'},{$set:{status:'cancelled','fulfillments.$[].status':'cancelled'}},{new:true});if(!order)return res.status(409).json({success:false,message:'Order cannot be cancelled'});try{await Promise.all(order.items.map(i=>Product.updateOne({_id:i.product},{$inc:{stock:i.quantity,sold:-i.quantity}})))}catch(error){await Order.updateOne({_id:order.id},{$set:{status:'processing','fulfillments.$[].status':'processing'}});throw error}res.json({success:true,data:order})}catch(e){next(e)}}); export default router;

