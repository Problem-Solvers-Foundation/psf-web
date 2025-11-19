/**
 * Script para promover um usuário para superuser
 *
 * Uso:
 * TARGET_EMAIL=haniel@psf.org node promote-superuser.js
 */

import { db } from './src/config/firebase.js';

const promoteToSuperuser = async () => {
  try {
    const email = process.env.TARGET_EMAIL || 'admin@example.com';
    console.log(`🔍 Procurando usuário: ${email}`);

    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      console.error(`❌ Usuário não encontrado: ${email}`);
      console.log('\n📋 Usuários disponíveis:');

      const allUsers = await usersCollection.get();
      allUsers.docs.forEach(doc => {
        const userData = doc.data();
        console.log(`   • ${userData.name} - ${userData.email} (${userData.role})`);
      });

      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log(`✅ Usuário encontrado: ${userData.name} - ${userData.email}`);
    console.log(`📝 Role atual: ${userData.role}`);

    if (userData.role === 'superuser') {
      console.log('ℹ️  Usuário já é superuser!');
      process.exit(0);
    }

    // Update to superuser
    await usersCollection.doc(userDoc.id).update({
      role: 'superuser',
      updatedAt: new Date()
    });

    console.log('🚀 Usuário promovido para SUPERUSER com sucesso!');
    console.log(`\n🔧 ${userData.name} agora tem permissões de superusuário:`);
    console.log('   ✅ Pode criar/editar/remover qualquer usuário');
    console.log('   ✅ Pode gerenciar outros administradores');
    console.log('   ✅ Acesso total ao sistema');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao promover usuário:', error);
    process.exit(1);
  }
};

promoteToSuperuser();