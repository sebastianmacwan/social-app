import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendOTP(email: string, otp: string, type: 'login' | 'forgot-password' = 'login') {
  try {
    const subject = type === 'login' ? 'Login OTP' : 'Password Reset OTP';
    const text = `Your OTP is: ${otp}. It expires in 5 minutes.`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text
    });

    console.log(`📧 ${type.toUpperCase()} OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function sendPasswordReset(email: string, newPassword: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Your new password is: ${newPassword}. Please change it after logging in.`
    });

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
      bronze: 'Bronze Plan - ₹100/month - 5 posts/day',
      silver: 'Silver Plan - ₹300/month - 10 posts/day',
      gold: 'Gold Plan - ₹1000/month - Unlimited posts'
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Subscription Invoice',
      text: `Thank you for subscribing to the ${planDetails[plan as keyof typeof planDetails] || plan} plan. Your subscription is now active.`
    });

    console.log(`📧 INVOICE sent to ${email} for ${plan} plan`);
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
}