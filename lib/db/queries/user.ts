"use server"

import { and, desc, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { activityLogs, pushSubscriptions, teamMembers, teams, User, users } from '../schema';
import { getServerSession } from '@/lib/auth/auth-options';
import { cache } from 'react';

export async function getUser() {
  const session = await getServerSession();
  if (!session?.user) {
    return null;
  }

  return session.user;
}

export async function getUserWithTeam(userId: string) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId,
      teamName: teams.name,
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function updateUser(userId: string, data: Partial<User>) {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}

