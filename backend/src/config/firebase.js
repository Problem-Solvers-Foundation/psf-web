/**
 * Firebase Admin SDK Configuration
 * Connects backend to Firebase/Firestore
 * Works in local development and production (Vercel, etc)
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
    let serviceAccount;

    // OPÇÃO 1: Usar variáveis de ambiente individuais (RECOMENDADO para Vercel/Render)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔧 Modo: PRODUÇÃO (usando variáveis de ambiente individuais)');

      // Remove aspas extras e processa a chave privada
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // OPÇÃO 2: Usar variável de ambiente com JSON completo
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('🔧 Modo: PRODUÇÃO (usando variável de ambiente JSON)');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // OPÇÃO 3: Usar arquivo serviceAccountKey.json (DESENVOLVIMENTO)
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

      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

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