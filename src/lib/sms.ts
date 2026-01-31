import twilio from 'twilio';
import { getDictionary } from './i18n/getDictionary';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Initialize client only if keys are present to avoid crash in environments without them
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMSOTP(to: string, otp: string, lang: string = 'en') {
  try {
    const dict = getDictionary(lang);
    // Strip HTML tags from the body for SMS
    const bodyText = dict.otp.body.replace('{otp}', otp).replace(/<[^>]*>?/gm, '');
    const message = `${bodyText} ${dict.otp.expires}`;

    if (!client || !fromPhone) {
      console.warn('⚠️ Twilio credentials missing. Using SIMULATED SMS for development.');
      console.log(`\n************************************************`);
      console.log(`[SIMULATED SMS]`);
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      console.log(`OTP: ${otp}`);
      console.log(`************************************************\n`);
      return true; // Return true to allow flow to continue without paid SMS
    }

    const response = await client.messages.create({
      body: message,
      from: fromPhone,
      to: to
    });

    console.log(`📱 SMS OTP sent to ${to}: ${response.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}
