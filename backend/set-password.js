/**
 * Script para definir senha para um usuário específico
 *
 * Uso:
 * TARGET_EMAIL=haniel@psf.org NEW_PASSWORD=novaSenha123 node set-password.js
 */

import { db } from './src/config/firebase.js';
import bcrypt from 'bcryptjs';

const setUserPassword = async () => {
  try {
    const email = process.env.TARGET_EMAIL || 'admin@example.com';
    const newPassword = process.env.NEW_PASSWORD || 'temporaryPassword123';

    console.log(`🔍 Procurando usuário: ${email}`);

    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      console.error(`❌ Usuário não encontrado: ${email}`);
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log(`✅ Usuário encontrado: ${userData.name} - ${userData.email}`);
    console.log(`📝 Role atual: ${userData.role}`);

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await usersCollection.doc(userDoc.id).update({
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log('🔒 Senha definida com sucesso!');
    console.log(`\n🔑 Credenciais de login:`);
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${newPassword}`);
    console.log(`\n⚠️  IMPORTANTE: Altere esta senha após o primeiro login!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao definir senha:', error);
    process.exit(1);
  }
};

setUserPassword();