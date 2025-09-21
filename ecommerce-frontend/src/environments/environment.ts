export const environment = {
  production: false,
  // Cambiar a false para usar Firebase real
  useFirebaseEmulator: false, // ✅ USANDO FIREBASE REAL
  firebase: {
    apiKey: "AIzaSyDIMqI_gqHU6FwrkCrIP4q60TJJ4WFW8qs",
    authDomain: "ecommerce-bambu-test.firebaseapp.com",
    projectId: "ecommerce-bambu-test",
    storageBucket: "ecommerce-bambu-test.firebasestorage.app",
    messagingSenderId: "182984354846",
    appId: "1:182984354846:web:7e7ad0eac5e41f3f92120f",
    measurementId: "G-4KZGX7VXYG"
  },
  backendApiUrl: 'http://localhost:3000/api/v1',
  dummyJsonApiUrl: 'https://dummyjson.com'
};
