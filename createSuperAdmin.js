import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';

const MONGODB_URI = "mongodb+srv://cloudlabel_db_user:cloudlabel%402025@admin-panel.ziw1mkn.mongodb.net/admin-panel";
const SUPER_ADMIN_EMAIL = "admin@gmail.com";
const SUPER_ADMIN_PASSWORD = "admin";

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const existingAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    
    const superAdmin = new User({
      employeeId: 'ADMIN001',
      name: 'Super Admin',
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin();