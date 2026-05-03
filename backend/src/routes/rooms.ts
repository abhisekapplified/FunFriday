import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { GameType } from '@prisma/client';

const router = Router();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { gameType } = req.body;
  if (!gameType || !Object.values(GameType).includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  let roomCode = generateRoomCode();
  while (await prisma.room.findUnique({ where: { roomCode } })) {
    roomCode = generateRoomCode();
  }

  const room = await prisma.room.create({
    data: { roomCode, hostId: req.userId!, gameType, status: 'WAITING' },
  });

  res.json({ room });
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const rooms = await prisma.room.findMany({
    where: { hostId: req.userId! },
    include: { sessions: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ rooms });
});

router.get('/stats', requireAuth, async (req: AuthRequest, res) => {
  const totalGames = await prisma.room.count({ where: { hostId: req.userId! } });
  const sessions = await prisma.gameSession.findMany({
    where: { room: { hostId: req.userId! } },
  });
  const totalParticipants = sessions.reduce((acc, s) => {
    return acc + Object.keys(s.scores as object).length;
  }, 0);
  res.json({ totalGames, totalParticipants });
});

export default router;
