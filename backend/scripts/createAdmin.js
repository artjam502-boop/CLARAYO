import 'dotenv/config';import bcrypt from 'bcryptjs';import {connectDB} from '../config/db.js';import User from '../models/User.js';
await connectDB();const email=process.env.ADMIN_EMAIL;if(!email||!process.env.ADMIN_PASSWORD)throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');await User.findOneAndUpdate({email},{name:process.env.ADMIN_NAME||'CLARAYO Admin',email,passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:'admin',accountStatus:'active'},{upsert:true,new:true});console.log(`Admin ready: ${email}`);process.exit();

