import bcrypt from 'bcryptjs';
import { env } from '../../../env';
import { prisma } from '../../../infra/database/prisma';
import { TUserEntity, UserEntity } from '../../user/entities/user.entity';

export class SignInLocalService {
  static async execute(email: string, password: string): Promise<TUserEntity | null> {
    const normalized = email.trim().toLowerCase();

    const result = await prisma.$transaction(
      async (prismaTransaction) => {
        const user = await prismaTransaction.user.findFirst({
          where: { email: normalized, is_deleted: false, status: 'active' },
        });

        if (user && user.password && bcrypt.compareSync(password, user.password)) {
          return UserEntity.parse(user);
        }

        return null;
      },
      { timeout: env.DEFAULT_PRISMA_TRANSACTION_TIMEOUT }
    );
    return result;
  }
}
