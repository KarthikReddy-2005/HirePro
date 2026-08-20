import { sendEmail } from "../src/services/email.service";

async function main() {
  await sendEmail({
    to: "23911a3574@vjit.ac.in",
    subject: "HirePro Test Email",
    html: "<h1>Hello from HirePro</h1><p>This is a test email using Brevo.</p>",
  });

  console.log("Email sent successfully");
}

main().catch((error) => {
  console.error("Failed to send email:", error);
  process.exit(1);
});
