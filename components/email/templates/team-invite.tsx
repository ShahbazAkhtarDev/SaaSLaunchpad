import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

interface TeamInviteTemplateProps {
    invitedByUsername?: string;
    teamName?: string;
    inviteLink?: string;
}

export default function TeamInviteTemplate({ inviteLink, invitedByUsername, teamName }: TeamInviteTemplateProps) {
    const previewText = `Join ${teamName} on ${process.env.APP_NAME || ''}`;
    const appLogo = process.env.APP_LOGO || '',
        appName = process.env.APP_NAME || ''

    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Preview>{previewText}</Preview>
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={appLogo}
                                height="50"
                                alt="Vercel"
                                className="my-0 mx-auto max-w-full"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Join <strong>{teamName}</strong> on <strong>{appName}</strong>
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>{invitedByUsername}</strong> has invited you to the <strong>{teamName}</strong> team on
                            <strong>{appName}</strong>.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={inviteLink}
                            >
                                Join the team
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            or copy and paste this URL into your browser:{' '}
                            <Link href={inviteLink} className="text-blue-600 no-underline">
                                {inviteLink}
                            </Link>
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}