/**
 * Script para verificar usuários existentes no sistema
 */

import { db } from './src/config/firebase.js';

const checkUsers = async () => {
  try {
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();

    if (snapshot.empty) {
      console.log('📋 Nenhum usuário encontrado no sistema.');
      console.log('\n💡 Para criar o primeiro admin, execute:');
      console.log('   ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=suaSenha node create-admin.js');
      return;
    }

    console.log('📋 Usuários encontrados no sistema:\n');
    console.log('┌────────────────────────────┬──────────────────────────────┬────────────┬──────────┬─────────────────────┐');
    console.log('│ Nome                       │ Email                        │ Role       │ Ativo    │ Último Login        │');
    console.log('├────────────────────────────┼──────────────────────────────┼────────────┼──────────┼─────────────────────┤');

    snapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const name = (userData.name || 'N/A').padEnd(26).substring(0, 26);
      const email = (userData.email || 'N/A').padEnd(28).substring(0, 28);
      const role = (userData.role || 'user').padEnd(10).substring(0, 10);
      const isActive = userData.isActive ? 'Sim      ' : 'Não      ';
      const lastLogin = userData.lastLogin ?
        new Date(userData.lastLogin.seconds * 1000).toLocaleDateString('pt-BR') + ' ' +
        new Date(userData.lastLogin.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Nunca               ';

      console.log(`│ ${name} │ ${email} │ ${role} │ ${isActive} │ ${lastLogin.padEnd(19)} │`);
    });

    console.log('└────────────────────────────┴──────────────────────────────┴────────────┴──────────┴─────────────────────┘');
    console.log(`\n📊 Total: ${snapshot.docs.length} usuário(s) encontrado(s)`);

    // Contar por role
    const roleCount = {};
    snapshot.docs.forEach(doc => {
      const role = doc.data().role || 'user';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    console.log('\n📈 Distribuição por role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   • ${role}: ${count} usuário(s)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
    process.exit(1);
  }
};

checkUsers();