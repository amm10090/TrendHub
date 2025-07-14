import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 配置邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 发送确认邮件给用户
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Welcome to TrendHub Newsletter',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TrendHub Newsletter</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #000000; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: bold;">Welcome to TrendHub Newsletter</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Thank you for subscribing to our newsletter. You'll be the first to know about:
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 15px; background-color: #f8f8f8; border-radius: 6px; margin-bottom: 10px;">
                            <p style="margin: 0; font-size: 15px; color: #333333;">🎉 Latest Products & Collections</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px; background-color: #f8f8f8; border-radius: 6px; margin-bottom: 10px;">
                            <p style="margin: 0; font-size: 15px; color: #333333;">💫 Exclusive Offers & Promotions</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px; background-color: #f8f8f8; border-radius: 6px;">
                            <p style="margin: 0; font-size: 15px; color: #333333;">✨ Fashion Inspiration & Trends</p>
                        </td>
                    </tr>
                </table>
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
                    Stay tuned for our next update. We're excited to have you join our fashion community!
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-top: 30px;">
                    <tr>
                        <td style="background-color: #000000; border-radius: 6px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Visit TrendHub</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">Best regards,<br>TrendHub Team</p>
                <p style="margin: 0; font-size: 12px; color: #999999;">
                    This email was sent to ${email}.<br>
                    © ${new Date().getFullYear()} TrendHub. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
    });

    // TODO: 将邮箱保存到数据库

    return NextResponse.json({ message: 'Subscription successful' }, { status: 200 });
  } catch {
    // TODO: 实现适当的服务器端日志系统
    // console.error('Newsletter subscription error:', error);

    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
