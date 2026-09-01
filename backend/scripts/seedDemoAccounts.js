/**
 * Seed Demo Accounts Script
 * Creates or updates demo accounts for testing purposes
 * Run: node scripts/seedDemoAccounts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { Admin, AdminProfile } = require('../models/Admin');
const Company = require('../models/company');

const demoAccounts = {
  user: {
    name: 'Demo User',
    email: 'user@demo.com',
    password: 'demo123',
    phone: '+1234567890'
  },
  admin: {
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'demo123',
    role: 'admin'
  },
  company: {
    name: 'Demo Travel Company',
    email: 'company@demo.com',
    password: 'demo123',
    description: 'A demo travel company for testing',
    phone: '+1234567890',
    website: 'https://demo-company.com',
    address: '123 Demo Street, Demo City'
  }
};

async function seedDemoAccounts() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log('✅ Connected to MongoDB\n');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(demoAccounts.user.password, salt);

    // 1. Create/Update Demo User
    console.log('👤 Creating/Updating Demo User...');
    const existingUser = await User.findOne({ email: demoAccounts.user.email });
    
    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.name = demoAccounts.user.name;
      existingUser.phone = demoAccounts.user.phone;
      await existingUser.save();
      console.log('✅ Demo User updated');
    } else {
      await User.create({
        ...demoAccounts.user,
        password: hashedPassword
      });
      console.log('✅ Demo User created');
    }
    console.log(`   📧 Email: ${demoAccounts.user.email}`);
    console.log(`   🔑 Password: ${demoAccounts.user.password}\n`);

    // 2. Create/Update Demo Admin
    console.log('👨‍💼 Creating/Updating Demo Admin...');
    const existingAdmin = await Admin.findOne({ email: demoAccounts.admin.email });
    
    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Demo Admin updated');
      
      // Update or create admin profile
      const existingProfile = await AdminProfile.findOne({ adminId: existingAdmin._id });
      if (existingProfile) {
        existingProfile.name = demoAccounts.admin.name;
        await existingProfile.save();
      } else {
        await AdminProfile.create({
          adminId: existingAdmin._id,
          name: demoAccounts.admin.name
        });
      }
    } else {
      const newAdmin = await Admin.create({
        email: demoAccounts.admin.email,
        password: hashedPassword
      });
      
      // Create admin profile
      await AdminProfile.create({
        adminId: newAdmin._id,
        name: demoAccounts.admin.name
      });
      
      console.log('✅ Demo Admin created');
    }
    console.log(`   📧 Email: ${demoAccounts.admin.email}`);
    console.log(`   🔑 Password: ${demoAccounts.admin.password}\n`);

    // 3. Create/Update Demo Company
    console.log('🏢 Creating/Updating Demo Company...');
    const existingCompany = await Company.findOne({ email: demoAccounts.company.email });
    
    if (existingCompany) {
      existingCompany.password = hashedPassword;
      existingCompany.name = demoAccounts.company.name;
      existingCompany.description = demoAccounts.company.description;
      existingCompany.phone = demoAccounts.company.phone;
      existingCompany.website = demoAccounts.company.website;
      existingCompany.address = demoAccounts.company.address;
      await existingCompany.save();
      console.log('✅ Demo Company updated');
    } else {
      await Company.create({
        ...demoAccounts.company,
        password: hashedPassword
      });
      console.log('✅ Demo Company created');
    }
    console.log(`   📧 Email: ${demoAccounts.company.email}`);
    console.log(`   🔑 Password: ${demoAccounts.company.password}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All demo accounts have been created/updated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Demo Credentials Summary:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ 👤 User Account                         │');
    console.log('│    Email:    user@demo.com              │');
    console.log('│    Password: demo123                    │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ 👨‍💼 Admin Account                        │');
    console.log('│    Email:    admin@demo.com             │');
    console.log('│    Password: demo123                    │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ 🏢 Company Account                      │');
    console.log('│    Email:    company@demo.com           │');
    console.log('│    Password: demo123                    │');
    console.log('└─────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo accounts:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDemoAccounts();
