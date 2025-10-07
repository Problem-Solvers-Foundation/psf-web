/**
 * Configuração do Firebase Admin SDK
 * Este arquivo conecta o backend ao Firebase/Firestore
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin
// IMPORTANTE: Você precisará criar um arquivo serviceAccountKey.json
// no Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Referência ao Firestore (banco de dados)
const db = admin.firestore();

// Referência ao Authentication
const auth = admin.auth();

// Exportar para usar em outros arquivos
module.exports = {
  admin,
  db,
  auth
};

console.log('🔥 Firebase conectado com sucesso!');