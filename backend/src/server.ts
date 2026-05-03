import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { setupSockets } from './sockets';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
});

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

setupSockets(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
