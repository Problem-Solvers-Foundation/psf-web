/**
 * Script para criar usuário de teste da comunidade
 *
 * Uso:
 * COMMUNITY_EMAIL=community@test.com COMMUNITY_PASSWORD=test123 COMMUNITY_NAME="Test User" node create-community-user.js
 */

import { db } from './src/config/firebase.js';
import bcrypt from 'bcryptjs';

const createCommunityUser = async () => {
  try {
    const email = process.env.COMMUNITY_EMAIL || 'community@example.com';
    const password = process.env.COMMUNITY_PASSWORD || 'changeMe123';
    const name = process.env.COMMUNITY_NAME || 'Community Test User';

    console.log(`🔍 Verificando se usuário já existe: ${email}`);

    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.where('email', '==', email).limit(1).get();

    if (!existingUser.empty) {
      console.log('⚠️  Usuário já existe! Atualizando...');

      const userDoc = existingUser.docs[0];
      const hashedPassword = await bcrypt.hash(password, 10);

      await usersCollection.doc(userDoc.id).update({
        name,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        updatedAt: new Date()
      });

      console.log('✅ Community user atualizado com sucesso!');
    } else {
      console.log('👤 Criando novo community user...');

      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      };

      await usersCollection.add(userData);
      console.log('✅ Community user criado com sucesso!');
    }

    console.log('\n🔑 Credenciais do Community User:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Nome: ${name}`);
    console.log(`   Role: user (Community User)`);

    console.log('\n🧪 Para testar o sistema:');
    console.log('1. Acesse http://localhost:3000/admin/login');
    console.log('2. Faça login com essas credenciais');
    console.log('3. Verifique se é redirecionado para /admin/community-dashboard');
    console.log('4. Tente acessar /admin/dashboard - deve ser bloqueado');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar community user:', error);
    process.exit(1);
  }
};

createCommunityUser();