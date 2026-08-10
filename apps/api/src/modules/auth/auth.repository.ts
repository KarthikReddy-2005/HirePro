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
