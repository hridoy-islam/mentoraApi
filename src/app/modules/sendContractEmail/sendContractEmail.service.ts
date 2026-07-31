import { sendEmail } from "../../utils/sendContactEmail";

const sendContactFormIntoDB = async (payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const { name, subject, message } = payload;

  const email = payload.email.trim().toLowerCase();

  await Promise.all([
    sendEmail(
      "support@medicaretraining.co.uk",
      // "mahitasnimul2@gmail.com",
      "contact-form-admin",
      `New Contact Form Submission: ${subject}`,
      { name, email, subject, message }
    ),
    sendEmail(
      email,
      "contact-form-user",
      "Thank you for contacting us – We'll be in touch!",
      { name, email, subject, message }
    ),
  ]);

  return { message: "Emails sent successfully" };
};

export const sendContractEmailServices = {
  sendContactFormIntoDB,
};