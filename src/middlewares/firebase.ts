import * as firebase from 'firebase-admin';
import serviceAccountRaw from '../../secret/service_account_key.json';

const serviceAccount: firebase.ServiceAccount = serviceAccountRaw as firebase.ServiceAccount;

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

console.log('Firebase Admin SDK initialized');

export default firebase;
