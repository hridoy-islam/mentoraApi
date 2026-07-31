import nodemailer from "nodemailer";
import ejs from "ejs";


 const transporter = nodemailer.createTransport({
    host: "smtp.ionos.co.uk",
     port: 587,
     secure: false,
    auth: {
      user: "noreply@medicaretraining.co.uk",
      pass: "Zadidsupriyo@2020",
    },
  });

export const sendPaymentSuccessEmail = async (
  to: string,
  data: Record<string, unknown>
) => {
  await transporter.verify();
  console.log("Payment email SMTP ready");

  const html = await ejs.renderFile(
    __dirname + "/../static/email_template/order-confirmation.ejs",
    data
  );

  const info = await transporter.sendMail({
    from: '"Medicare Training" <noreply@medicaretraining.co.uk>',
    to,
    subject: "Order Confirmation – Thank you for your purchase!",
    html,
  });


};
