import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAK_E_d_jE67-X3-0NOH1PqUlwMRMPX76M",
  authDomain: "material-ui-project-ef493.firebaseapp.com",
  projectId: "material-ui-project-ef493",
  storageBucket: "material-ui-project-ef493.firebasestorage.app",
  messagingSenderId: "4146082752",
  appId: "1:4146082752:web:de26cc0acbcf65a3cb0e25"
};

const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)