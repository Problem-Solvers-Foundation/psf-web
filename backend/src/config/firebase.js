/**
 * Configuração do Firebase Admin SDK
 * Este arquivo conecta o backend ao Firebase/Firestore
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Para usar __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
// IMPORTANTE: Você precisará criar um arquivo serviceAccountKey.json
// no Firebase Console > Project Settings > Service Accounts
const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Referência ao Firestore (banco de dados)
export const db = admin.firestore();

// Referência ao Authentication
export const auth = admin.auth();

// Exportar admin também
export { admin };

// Export default para compatibilidade
export default admin;

console.log('🔥 Firebase conectado com sucesso!');