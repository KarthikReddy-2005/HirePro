import axios from "axios";
import { env } from "../config/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface BrevoEmailResponse {
  messageId: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<BrevoEmailResponse> => {
  const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

  try {
    const response = await axios.post<BrevoEmailResponse>(
      BREVO_API_URL,
      {
        sender: {
          name: "HirePro",
          email: env.EMAIL_FROM,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    return {
      messageId: response.data.messageId,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to send email: ${error.response?.data?.message || error.message}`);
    }
    throw new Error(`Failed to send email: ${error}`);
  }
};
