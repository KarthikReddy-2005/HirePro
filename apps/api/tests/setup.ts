import { prisma } from "../src/config/prisma";

export const cleanDatabase = async () => {
  await prisma.user.deleteMany();
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};
