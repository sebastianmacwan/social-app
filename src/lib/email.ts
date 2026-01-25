export async function sendOTP(email: string, otp: string, type: 'login' | 'forgot-password' = 'login') {
  // For development, just log the OTP
  console.log(`📧 ${type.toUpperCase()} OTP sent to ${email}: ${otp}`);

  // TODO: Replace with actual email sending service
  // Example with Nodemailer:
  /*
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${type === 'login' ? 'Login' : 'Password Reset'} OTP`,
    text: `Your OTP is: ${otp}. It expires in 5 minutes.`
  });
  */

  return true;
}

export async function sendPasswordReset(email: string, newPassword: string) {
  // For development, just log the password
  console.log(`📧 PASSWORD RESET sent to ${email}: ${newPassword}`);

  // TODO: Replace with actual email sending service

  return true;
}

export async function sendInvoice(email: string, plan: string) {
  // For development, just log the invoice
  console.log(`📧 INVOICE sent to ${email} for ${plan} plan`);

  // TODO: Replace with actual email sending service

  return true;
}