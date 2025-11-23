/**
 * Script para criar índices necessários no Firestore
 * Execute este script uma vez para criar os índices compostos necessários
 */

import { db } from './src/config/firebase.js';

async function createIndexes() {
  console.log('🔧 Iniciando criação de índices Firestore...');

  try {
    // Teste a query que requer o índice para forçar a criação automática
    console.log('📝 Testando query de replies para forçar criação do índice...');

    // Esta query vai falhar na primeira vez, mas vai mostrar o link para criar o índice
    try {
      await db.collection('replies')
        .where('discussionId', '==', 'test')
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

      console.log('✅ Índice já existe e está funcionando!');
    } catch (error) {
      if (error.code === 9) { // FAILED_PRECONDITION
        console.log('⚠️  Índice não existe. Criando automaticamente...');
        console.log('📋 Link para criar o índice:');
        console.log(error.details.split('You can create it here: ')[1]);

        // Vamos tentar acessar o Firebase Admin para criar o índice programaticamente
        console.log('🔄 Tentando criar uma entrada de teste para triggerar o índice...');

        // Criar documento de teste para triggerar a criação do índice
        const testDiscussionRef = await db.collection('discussions').add({
          title: 'Test Discussion for Index',
          content: 'This is a test discussion to create the required index.',
          category: 'Test',
          authorId: 'test-user',
          createdAt: new Date(),
          views: 0
        });

        const testReplyRef = await db.collection('replies').add({
          discussionId: testDiscussionRef.id,
          content: 'Test reply to create index',
          authorId: 'test-user',
          createdAt: new Date()
        });

        console.log('✅ Documentos de teste criados.');

        // Tentar a query novamente
        console.log('🔄 Tentando query novamente...');
        try {
          await db.collection('replies')
            .where('discussionId', '==', testDiscussionRef.id)
            .orderBy('createdAt', 'asc')
            .get();

          console.log('✅ Query funcionou! Índice foi criado automaticamente.');
        } catch (secondError) {
          if (secondError.code === 9) {
            console.log('⚠️  Índice ainda não está pronto. Siga estas instruções:');
            console.log('1. Acesse o link: https://console.firebase.google.com/project/problem-solver-foundation/firestore/indexes');
            console.log('2. Ou use este link direto:', secondError.details.split('You can create it here: ')[1]);
            console.log('3. Clique em "Create Index" e aguarde alguns minutos');
            console.log('4. O índice será criado automaticamente');
          }
        }

        // Limpar documentos de teste
        await testDiscussionRef.delete();
        await testReplyRef.delete();
        console.log('🧹 Documentos de teste removidos.');

      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Erro ao criar índices:', error);
  }
}

// Execute o script
createIndexes().then(() => {
  console.log('📋 Script finalizado.');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});