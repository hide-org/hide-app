import { v4 as uuidv4 } from 'uuid';
import { getUserAccount, createUserAccount } from '@/main/db';

export const getOrCreateUserId = (): string => {
    let userId;
    const userAccount = getUserAccount();
    if (userAccount) {
        userId = userAccount.user_id;
    } else {
        userId = uuidv4();
        createUserAccount(userId);
    }
    return userId;
}
