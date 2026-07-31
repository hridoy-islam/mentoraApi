import nodemailer from "nodemailer";
import ejs from "ejs";

export const sendEmail = async (
  to: string,
  template: string,
  subject: string,
  data: Record<string, unknown>,
) => {
  // const transporter = nodemailer.createTransport({
  //   host: "smtp.ionos.co.uk",
  //   port: 465,
  //   secure: true,
  //   auth: {
  //     user: "support@medicaretraining.co.uk",
  //     pass: "Zadidsupriyo@2020",
  //   },
  // });
const transporter = nodemailer.createTransport({
    host: "smtp.ionos.co.uk",
     port: 587,
     secure: false,
    auth: {
      user: "support@medicaretraining.co.uk	",
      pass: "Zadidsupriyo@2020",
    },
  });
  await transporter.verify();
  console.log("SMTP Server is ready");

  try {
    const html = await ejs.renderFile(
      __dirname + "/../static/email_template/" + template + ".ejs",
      data,
    );
    const mailOptions = {
      from: '"Medicare Training" <support@medicaretraining.co.uk	>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
