import { PrismaClient } from '@prisma/client';

const isAdmin = async (req, res, next) => {
  const prisma = new PrismaClient();
  if (!req.user || !req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await prisma.users.findUnique({ where: { id: req.user.userId } });
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};

export default isAdmin;
