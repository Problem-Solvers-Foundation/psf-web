/**
 * Configuração do Firebase Admin SDK
 * Este arquivo conecta o backend ao Firebase/Firestore
 * Funciona tanto localmente quanto em produção (Render, Railway, etc)
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Para usar __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin apenas uma vez
if (!admin.apps.length) {
  try {
    // PRODUÇÃO: Usar variável de ambiente FIREBASE_SERVICE_ACCOUNT
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('🔧 Modo: PRODUÇÃO (usando variável de ambiente)');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // DESENVOLVIMENTO: Usar arquivo serviceAccountKey.json
    else {
      console.log('🔧 Modo: DESENVOLVIMENTO (usando serviceAccountKey.json)');
      const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');

      if (!existsSync(serviceAccountPath)) {
        throw new Error(
          '❌ Arquivo serviceAccountKey.json não encontrado!\n' +
          '   Baixe-o no Firebase Console > Project Settings > Service Accounts\n' +
          '   E salve em: backend/serviceAccountKey.json'
        );
      }

      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    console.log('🔥 Firebase conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar Firebase:', error.message);
    process.exit(1);
  }
}

// Referência ao Firestore (banco de dados)
export const db = admin.firestore();

// Referência ao Authentication
export const auth = admin.auth();

// Exportar admin também
export { admin };

// Export default para compatibilidade
export default admin;