// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import paypalRoutes from './routes/paypal.js';
dotenv.config();

const app = express();

// Note: we use express.raw on webhook route specifically in routes/paypal
app.use('/paypal', paypalRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));


// Allow your React frontend to access the API
// app.use(cors({
//   origin: 'http://localhost:5173', // Allow requests only from this origin (Vite's dev server)
//   methods: ['GET', 'POST', 'OPTIONS'], // Allow specific methods (GET, POST, OPTIONS)
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allow specific headers
//   credentials: true, // Allow cookies or authorization headers to be sent
// }));

// Explicitly handle OPTIONS preflight requests
// app.options('*', cors());
