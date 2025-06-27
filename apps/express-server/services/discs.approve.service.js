import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const approveDiscService = async (discId) => {
  const disc = await prisma.disc_master.findUnique({ where: { id: discId } });

  if (!disc) {
    const error = new Error('Disc not found');
    error.name = 'NotFoundError';
    error.status = 404;
    throw error;
  }
  return prisma.disc_master.update({
    where: { id: discId },
    data: { approved: true },
  });
};

export default approveDiscService;
