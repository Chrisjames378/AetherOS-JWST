import { db } from './index.ts';
import { users, observations } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  photoUrl?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoUrl: photoUrl || '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || email.split('@')[0],
          photoUrl: photoUrl || '',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserObservations(userId: number) {
  try {
    return await db
      .select()
      .from(observations)
      .where(eq(observations.userId, userId))
      .orderBy(desc(observations.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserObservations:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function addObservation(
  userId: number,
  targetName: string,
  targetId: string,
  category: string,
  notes: string,
  wavelengthBand?: string,
  snrRatio?: string
) {
  try {
    const result = await db
      .insert(observations)
      .values({
        userId,
        targetName,
        targetId,
        category,
        notes,
        wavelengthBand: wavelengthBand || 'Near-Infrared (NIRCam)',
        snrRatio: snrRatio || '38.4 dB',
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in addObservation:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
