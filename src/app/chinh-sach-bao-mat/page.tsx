import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật Thông Tin - Japan Shop",
  description: "Cam kết bảo mật tuyệt đối thông tin cá nhân và dữ liệu thanh toán của khách hàng tại Japan Shop.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Chính sách bảo mật thông tin" },
          ]}
        />

        <div className="mt-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-3">
              Bảo mật tuyệt đối
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Chính Sách Bảo Mật Thông Tin
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Quy định về việc thu thập, sử dụng và bảo mật dữ liệu khách hàng theo đúng chuẩn pháp luật
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                1. Mục đích thu thập thông tin cá nhân
              </h2>
              <p>Japan Shop chỉ thu thập các thông tin cần thiết khi quý khách đặt hàng trên website, bao gồm:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Họ và tên người nhận hàng</li>
                <li>Số điện thoại liên lạc</li>
                <li>Địa chỉ chi tiết nhận hàng</li>
                <li>Ghi chú đơn hàng (nếu có)</li>
              </ul>
              <p>
                Mục đích duy nhất: Liên hệ xác nhận đơn, bàn giao cho đơn vị chuyển phát để giao hàng và hỗ trợ hậu mãi/bảo hành.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                2. Cam kết bảo mật thông tin
              </h2>
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-200">
                <strong>Không chia sẻ cho bên thứ ba:</strong> Japan Shop cam kết không bán, không trao đổi hoặc chia sẻ thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại hoặc quảng cáo trái phép.
              </div>
              <p>
                Dữ liệu khách hàng được bảo vệ trên hệ thống máy chủ cơ sở dữ liệu Supabase được mã hóa chuẩn ngành.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                3. Quyền chỉnh sửa và xóa thông tin
              </h2>
              <p>
                Bất cứ khi nào quý khách muốn kiểm tra, chỉnh sửa hoặc yêu cầu hủy bỏ thông tin cá nhân đã lưu trữ, vui lòng liên hệ hotline/Zalo: <strong>0902 493 895</strong> hoặc gửi thư về <strong>japanshop.tuyan78@gmail.com</strong> để được xử lý ngay lập tức.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                4. Đơn vị thu thập và quản lý thông tin
              </h2>
              <p><strong>Cửa hàng Japan Shop (C3 Shop)</strong></p>
              <p className="text-xs text-zinc-500">
                Địa chỉ: 1017/26/18 Lê Văn Lương (90A đường B7, khu B, làng đại học), Ấp 3, Nhà Bè, TP. Hồ Chí Minh<br />
                Hotline hỗ trợ: 0902 493 895
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
