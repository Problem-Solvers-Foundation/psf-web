/**
 * Script para criar usuário admin inicial
 * Execute: node create-admin.js
 */

import { db } from './src/config/firebase.js';
import bcrypt from 'bcryptjs';

const createAdminUser = async () => {
  try {
    const usersCollection = db.collection('users');

    // Verificar se admin já existe
    const adminSnapshot = await usersCollection.where('email', '==', 'admin@psf.org').get();

    if (!adminSnapshot.empty) {
      console.log('❌ Admin user already exists!');
      console.log('Updating password hash...');

      const adminDoc = adminSnapshot.docs[0];
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await usersCollection.doc(adminDoc.id).update({
        password: hashedPassword,
        name: 'PSF Administrator',
        role: 'admin',
        isActive: true,
        updatedAt: new Date()
      });

      console.log('✅ Admin user updated successfully!');
    } else {
      // Criar novo admin
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const adminData = {
        name: 'PSF Administrator',
        email: 'admin@psf.org',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      };

      await usersCollection.add(adminData);
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@psf.org');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdminUser();
