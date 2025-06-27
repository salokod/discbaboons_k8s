import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const approveDiscService = async (discId) => {
  const disc = await prisma.disc_master.findUnique({ where: { id: discId } });
  if (!disc) {
    throw new Error('Disc not found');
  }
  return prisma.disc_master.update({
    where: { id: discId },
    data: { approved: true },
  });
};

export default approveDiscService;
