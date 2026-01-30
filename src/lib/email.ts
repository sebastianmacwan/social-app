import sgMail from '@sendgrid/mail';
import { getDictionary } from './i18n/getDictionary';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendOTP(email: string, otp: string, type: 'login' | 'forgot-password' | 'language_switch' = 'login', lang: string = 'en') {
  try {
    const dict = getDictionary(lang);
    let subject = "";
    if (type === 'login') subject = dict.otp.loginSubject;
    else if (type === 'forgot-password') subject = dict.otp.forgotSubject;
    else if (type === 'language_switch') subject = "Language Change Verification";
    else subject = "Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>${dict.otp.body.replace('{otp}', otp)}</p>
        <p>${dict.otp.expires}</p>
        <p>${dict.otp.ignore}</p>
      </div>
    `;

    const msg = {
      to: email,
      from: 'sebastianmacwan95@gmail.com', // Your verified SendGrid sender
      subject,
      html,
    };

    await sgMail.send(msg);

    console.log(`📧 ${type.toUpperCase()} OTP sent to ${email} in ${lang}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function sendPasswordReset(email: string, newPassword: string) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Your new password is: <strong>${newPassword}</strong></p>
        <p>Please change it after logging in for security.</p>
      </div>
    `;

    const msg = {
      to: email,
      from: 'sebastianmacwan95@gmail.com',
      subject: 'Password Reset',
      html,
    };

    await sgMail.send(msg);

    console.log(`📧 PASSWORD RESET sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

export async function sendInvoice(email: string, plan: string) {
  try {
    const planDetails = {
      free: 'Free Plan - ₹0/month - 1 post/day',
      bronze: 'Bronze Plan - ₹100/month - 5 posts/day',
      silver: 'Silver Plan - ₹300/month - 10 posts/day',
      gold: 'Gold Plan - ₹1000/month - Unlimited posts'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Subscription Invoice</h2>
        <p>Thank you for subscribing to the <strong>${planDetails[plan as keyof typeof planDetails] || plan}</strong> plan.</p>
        <p>Your subscription is now active.</p>
        <p>Enjoy posting!</p>
      </div>
    `;

    const msg = {
      to: email,
      from: 'sebastianmacwan95@gmail.com',
      subject: 'Subscription Invoice',
      html,
    };

    await sgMail.send(msg);

    console.log(`📧 INVOICE sent to ${email} for ${plan} plan`);
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
}