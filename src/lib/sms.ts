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
      return true; 
    }

    // Ensure 'to' number starts with '+' (E.164 format)
    let formattedTo = to.trim();
    if (!formattedTo.startsWith('+')) {
      // If it doesn't start with +, we can't be sure of the country code.
      // However, for India (+91) we can try to be helpful if it's 10 digits.
      if (formattedTo.length === 10) {
        formattedTo = '+91' + formattedTo;
        console.log(`ℹ️ Prepending +91 to 10-digit number: ${formattedTo}`);
      } else {
        console.warn(`⚠️ Phone number "${to}" does not start with "+". Twilio may reject it.`);
      }
    }

    console.log(`📱 Attempting to send REAL SMS to ${formattedTo}...`);
    const response = await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedTo
    });

    console.log(`✅ REAL SMS OTP sent to ${formattedTo}: ${response.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}
