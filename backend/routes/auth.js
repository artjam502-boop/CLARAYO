import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
const router = Router();
const invalid = (req, res) => { const e = validationResult(req); if (!e.isEmpty()) { res.status(422).json({ success:false, message:e.array()[0].msg, errors:e.array() }); return true; } };
router.post('/register', [body('name').trim().isLength({min:2}), body('email').isEmail().normalizeEmail(), body('password').isLength({min:8,max:16}).withMessage('Password must be 8 to 16 characters')], async (req,res,next)=>{
  try { if(invalid(req,res)) return; const {name,email,password}=req.body; if(await User.exists({email})) return res.status(409).json({success:false,message:'Email is already registered'});
    const user=await User.create({name,email,passwordHash:await bcrypt.hash(password,12)}); const token=jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'}); res.status(201).json({success:true,data:{user,token}});
  } catch(e){next(e)}
});
router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], async(req,res,next)=>{
  try { if(invalid(req,res)) return; const user=await User.findOne({email:req.body.email}).select('+passwordHash'); if(!user||!(await bcrypt.compare(req.body.password,user.passwordHash))) return res.status(401).json({success:false,message:'Invalid email or password'}); if(user.accountStatus!=='active') return res.status(403).json({success:false,message:'Account is suspended'});
    const token=jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'}); user.passwordHash=undefined; res.json({success:true,data:{user,token}});
  }catch(e){next(e)}
});
router.post('/logout',(req,res)=>res.json({success:true,message:'Logged out'}));
router.get('/me',protect,(req,res)=>res.json({success:true,data:req.user}));
router.put('/me',protect,async(req,res,next)=>{try{ const allowed=['name','phone','address']; for(const k of allowed) if(req.body[k]!==undefined) req.user[k]=req.body[k]; await req.user.save(); res.json({success:true,data:req.user}); }catch(e){next(e)}});
export default router;

