import { prisma } from "../../config/prisma";
import ApiError from "../../utils/ApiError";

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
    select: {
      id: true,
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
      isEmailVerified: true,
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

export const findEmailVerificationByToken = async (tokenHash: string) => {
  return await prisma.emailVerification.findUnique({ where: { tokenHash } });
};

export const consumeEmailVerification = async (userId: string, verificationId: string) => {
  return prisma.$transaction(async (tx) => {
    const result = await tx.emailVerification.updateMany({
      where: {
        id: verificationId,
        userId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (result.count !== 1) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        isEmailVerified: true,
      },
    });
  });
};

export const createPasswordReset = async (data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) => {
  return await prisma.passwordReset.create({ data });
};

export const findPasswordResetByToken = async (tokenHash: string) => {
  return await prisma.passwordReset.findUnique({ where: { tokenHash } });
};

export const updatePasswordReset = async (userId: string, id: string, hashedPassword: string) => {
  return await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    }),
  ]);
};

export const createRefreshToken = async (data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) => {
  return prisma.refreshToken.create({
    data,
  });
};

export const findRefreshTokenByHash = async (tokenHash: string) => {
  return prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });
};

export const revokeRefreshToken = async (id: string) => {
  return prisma.refreshToken.updateMany({
    where: {
      id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const createUserWithEmailVerification = async (data: {
  username: string;
  displayName: string;
  email: string;
  hashedPassword: string;
  tokenHash: string;
  expiresAt: Date;
}) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        hashedPassword: data.hashedPassword,
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

    await tx.emailVerification.create({
      data: {
        userId: user.id,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });

    return user;
  });
};

export const findUserForVerification = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      isEmailVerified: true,
    },
  });
};

export const invalidateEmailVerifications = async (userId: string) => {
  return prisma.emailVerification.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
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