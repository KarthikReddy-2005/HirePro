import { prisma } from "../../config/prisma";

export const findUserByUsername = async (username: string) => {
  return await prisma.user.findUnique({
    where: {
      username,
    },
  });
};
export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};
export const createUser = async (data: {
  username: string;
  displayName: string;
  email: string;
  hashedPassword: string;
}) => {
  return await prisma.user.create({
    data,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findPasswordByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      hashedPassword: true,
    },
  });
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const createEmailVerification = async (data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) => {
  return await prisma.emailVerification.create({ data });
};

export const findEmailVerificationByToken = async (tokenHash: string) => {
  return await prisma.emailVerification.findUnique({ where: { tokenHash } });
};

export const updateEmailVerification = async (userId: string, id: string) => {
  return await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    }),
    prisma.emailVerification.update({
      where: { id },
      data: { usedAt: new Date() },
    }),
  ]);
};

