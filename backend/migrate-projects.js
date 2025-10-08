/**
 * SCRIPT DE MIGRAÇÃO - Atualizar categorias antigas para novas
 * Execute: node migrate-projects.js
 */

const { db } = require('./src/config/firebase');

// Mapeamento de categorias antigas para novas
const categoryMapping = {
  'solutions': 'technology',      // Solutions → Technology
  'progress': 'education',        // Progress → Education
  'impact': 'health'              // Impact → Health
};

async function migrateProjects() {
  console.log('🔄 Iniciando migração de projetos...\n');
  
  try {
    const projectsCollection = db.collection('projects');
    const snapshot = await projectsCollection.get();
    
    if (snapshot.empty) {
      console.log('⚠️  Nenhum projeto encontrado no banco de dados.');
      process.exit(0);
    }
    
    console.log(`📊 Encontrados ${snapshot.size} projeto(s) para migrar.\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const doc of snapshot.docs) {
      const project = doc.data();
      const oldCategory = project.category;
      
      // Verificar se categoria já está no novo formato
      const newCategories = [
        'environment', 'health', 'education', 'cybersecurity',
        'poverty', 'technology', 'water', 'energy', 'food',
        'housing', 'community', 'women-empowerment', 'youth-development', 'other'
      ];
      
      if (newCategories.includes(oldCategory)) {
        console.log(`⏭️  Pulando "${project.title}" - já está no novo formato (${oldCategory})`);
        skipped++;
        continue;
      }
      
      // Mapear categoria antiga para nova
      const newCategory = categoryMapping[oldCategory] || 'other';
      
      // Adicionar campo status se não existir
      const status = project.status || 'active';
      
      // Atualizar documento
      await projectsCollection.doc(doc.id).update({
        category: newCategory,
        status: status,
        updatedAt: new Date()
      });
      
      console.log(`✅ Atualizado "${project.title}"`);
      console.log(`   Categoria: ${oldCategory} → ${newCategory}`);
      console.log(`   Status: ${status}\n`);
      
      updated++;
    }
    
    console.log('\n🎉 Migração concluída!');
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📊 Total: ${snapshot.size}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Perguntar confirmação antes de executar
console.log('⚠️  ATENÇÃO: Este script vai atualizar TODOS os projetos no Firestore.');
console.log('   Mapeamento de categorias:');
console.log('   - solutions → technology');
console.log('   - progress → education');
console.log('   - impact → health');
console.log('');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Deseja continuar? (sim/não): ', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() === 'sim' || answer.toLowerCase() === 's') {
    migrateProjects();
  } else {
    console.log('❌ Migração cancelada.');
    process.exit(0);
  }
});