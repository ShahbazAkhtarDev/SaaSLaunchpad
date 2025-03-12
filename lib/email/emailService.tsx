import { sendEmail } from '@/lib/email';
import { APIRoutes } from '@/types/enums/routes';
import TeamInviteTemplate from '@/components/email/templates/team-invite';
import { z } from 'zod';

const sendTeamInvitationEmailSchema = z.object({
    email: z.string().email(),
    inviteId: z.number(),
    teamName: z.string(),
    invitedByUsername: z.string(),
});

export const sendTeamInvitationEmail = async (
    { email, inviteId, teamName, invitedByUsername }:
        z.infer<typeof sendTeamInvitationEmailSchema>
) => {

    const inviteUrl = new URL(APIRoutes.TEAM_INVITE, process.env.BASE_URL);
    inviteUrl.searchParams.set('inviteId', inviteId.toString());

    await sendEmail({
        to: email,
        subject: `You have been invited to join ${teamName}`,
        template: (
            <TeamInviteTemplate 
                inviteLink={inviteUrl.toString()} 
                invitedByUsername={invitedByUsername}
                teamName={teamName}
            />
        ),
    });
}