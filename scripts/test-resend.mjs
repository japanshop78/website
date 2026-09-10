import "dotenv/config";
import { Resend } from "resend";

// Tự động lấy từ file .env hoặc thay thế bằng key 're_xxxxxxxxx' của bạn
const apiKey = process.env.RESEND_API_KEY || "re_xxxxxxxxx";
const resend = new Resend(apiKey);

async function sendTestEmail() {
  console.log("🚀 Đang gửi email thử nghiệm qua Resend API...");
  console.log("Gửi tới: japanshop.tuyan78@gmail.com");
  
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "japanshop.tuyan78@gmail.com",
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    });

    if (error) {
      console.error("❌ Lỗi từ Resend:", error);
      return;
    }

    console.log("✅ Gửi email thành công! Message ID:", data?.id);
  } catch (err) {
    console.error("❌ Ngoại lệ khi gửi email:", err.message);
  }
}

sendTestEmail();
