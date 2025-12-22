import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

const MONGODB_URI = "mongodb+srv://cloudlabel_db_user:cloudlabel%402025@admin-panel.ziw1mkn.mongodb.net/admin-panel";
const accounts = [
  {
    email: "admin@gmail.com",
    password: "admin",
    employeeId: "ADMIN001",
    name: "Super Admin",
    role: "super-admin"
  },
  {
    email: "havefun@havefun.com",
    password: "havefun@2025",
    employeeId: "DEV001",
    name: "Developer Console",
    role: "developer"
  },
  {
    email: "balajibm@cloudheard.com",
    password: "Balaji@2025",
    employeeId: "ADMIN002",
    name: "Super Admin 2",
    role: "super-admin"
  },
  {
    email: "superadmin3@cloudheard.com",
    password: "SuperAdmin@2026",
    employeeId: "ADMIN003",
    name: "Super Admin 3",
    role: "super-admin"
  }
];

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    for (const account of accounts) {
      const existingUser = await User.findOne({ email: account.email });
      if (existingUser) {
        console.log(`${account.name} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(account.password, 12);
      
      const user = new User({
        employeeId: account.employeeId,
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role
      });

      await user.save();
      console.log(`${account.name} created successfully - Email: ${account.email}`);
    }
    
    console.log('\n=== Admin Accounts Created ===');
    console.log('1. Super Admin: admin@gmail.com / admin');
    console.log('2. Developer Console: havefun@havefun.com / havefun@2025');
    console.log('3. Super Admin 2: balajibm@cloudheard.com / Balaji@2025');
    console.log('4. Super Admin 3: superadmin3@cloudheard.com / SuperAdmin@2026');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin();