import { prisma } from "../src/config/prisma";

export const cleanDatabase = async () => {
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();

  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.emailVerification.deleteMany();

  await prisma.user.deleteMany();
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};