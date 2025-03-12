"use server";

import { z } from 'zod';
import nodemailer from 'nodemailer';
import { ReactNode } from 'react';
import { render } from '@react-email/components';


const sendEmailSchema = z.object({
    to: z.string().email(), // Validate 'to' as an email
    subject: z.string().min(1, 'Subject is required'),
    cc: z.string().email().optional(),
    bcc: z.string().email().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
    template: z.custom<ReactNode>().optional(),
}).refine(data => data.text || data.html || data.template, {
    message: "Either 'text', 'html' or 'template' must be provided",
});

export const sendEmail = async (data: z.infer<typeof sendEmailSchema>) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
        },
    });
    let html = data.html;
    if (data.template) {
        html = await renderTemplate(data.template);
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        text: data.text,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email: ' + error);
        return false;
    }
};

export const renderTemplate = async (emailTemplate: ReactNode) => {
    const emailHtml = await render(
        <>
            {emailTemplate}
        </>
    );
    return emailHtml;
}
