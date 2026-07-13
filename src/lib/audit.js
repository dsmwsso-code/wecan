import { prisma } from './prisma';

export async function logAction({ userId, action, entity, entityId = null, ipAddress = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
