/**
 * Script para criar usuário admin inicial
 *
 * IMPORTANTE: Configure as variáveis de ambiente antes de executar:
 * - ADMIN_EMAIL: Email do administrador
 * - ADMIN_PASSWORD: Senha do administrador (será hashada automaticamente)
 *
 * Execute: ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=suaSenhaSegura node create-admin.js
 */

import { db } from './src/config/firebase.js';
import bcrypt from 'bcryptjs';

const createAdminUser = async () => {
  try {
    // Validar variáveis de ambiente obrigatórias
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required!');
      console.error('\nUsage:');
      console.error('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securePassword123 node create-admin.js');
      console.error('\nSecurity Note:');
      console.error('  - Use a strong password (min 12 characters, mixed case, numbers, symbols)');
      console.error('  - Never commit credentials to version control');
      console.error('  - Store credentials securely (use .env file in production)');
      process.exit(1);
    }

    // Validar força da senha
    if (adminPassword.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters long');
      console.error('Recommended: Use at least 12 characters with mixed case, numbers, and symbols');
      process.exit(1);
    }

    const usersCollection = db.collection('users');

    // Verificar se admin já existe
    const adminSnapshot = await usersCollection.where('email', '==', adminEmail).get();

    if (!adminSnapshot.empty) {
      console.log('⚠️  Admin user already exists!');
      console.log('Updating password hash...');

      const adminDoc = adminSnapshot.docs[0];
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

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
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const adminData = {
        name: 'PSF Administrator',
        email: adminEmail,
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
    console.log(`Email: ${adminEmail}`);
    console.log('Password: (the password you provided - keep it secure!)');
    console.log('\n🔒 Security Reminders:');
    console.log('  - Store credentials in a password manager');
    console.log('  - Never share credentials via insecure channels');
    console.log('  - Change password regularly');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdminUser();
