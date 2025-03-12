import { and, eq, ne, not } from 'drizzle-orm';
import { db } from '../drizzle';
import { invitations, teamMembers, teams, users } from '../schema';
import { getUser, updateUser } from './user';

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId));
}

export async function getTeamForUser(userId: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      teamMembers: {
        with: {
          team: {
            with: {
              teamMembers: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.teamMembers[0]?.team || null;
}

export async function createTeam({ teamName, ownerId }: { teamName: string; ownerId: string }) {
  const [team] = await db
    .insert(teams)
    .values({
      name: teamName,
    })
    .returning();
  
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: ownerId,
    role: 'owner',
  });

  return team;
}

export async function addInvitedUserToTeam({ inviteId, userId }: { inviteId: number, userId: string }) {
  const [alreadyAMember] = await db
    .select()
    .from(teamMembers)
    .where(
      eq(teamMembers.userId, userId)
    )
    .limit(1);

  if (alreadyAMember) {
    return false;
  }

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.id, inviteId),
        eq(invitations.status, 'pending'),
        ne(invitations.invitedBy, userId),
      )
    )
    .limit(1);

  if (!invitation) {
    return false;
  }

  await db.insert(teamMembers).values({
    teamId: invitation.teamId,
    userId: userId,
    role: invitation.role,
  });

  await updateUser(userId, {
    role: invitation.role
  });

  await db.update(invitations)
    .set({
      status: 'accepted',
    })
    .where(eq(invitations.id, inviteId));
  return true;
}