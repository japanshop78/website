import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Chính Sách Đổi Trả & Bảo Hành - Japan Shop",
  description: "Chính sách đổi trả, bảo hành và cam kết 100% hàng nội địa Nhật Bản chính hãng tại Japan Shop.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Chính sách đổi trả & bảo hành" },
          ]}
        />

        <div className="mt-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 mb-3">
              Cam kết chất lượng
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Chính Sách Đổi Trả & Bảo Hành
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Áp dụng cho tất cả khách hàng mua sắm tại hệ thống Japan Shop (C3 Shop)
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>1. Cam kết chất lượng chính hãng 100%</span>
              </h2>
              <p>
                Japan Shop cam kết tất cả sản phẩm mỹ phẩm, thực phẩm chức năng, đồ dùng mẹ & bé và đồ gia dụng được cung cấp trên website đều là <strong>hàng nội địa Nhật Bản chính hãng 100%</strong>, được nhập khẩu hoặc xách tay trực tiếp từ các chuỗi siêu thị/nhà thuốc lớn tại Nhật (Matsumoto Kiyoshi, Don Quijote, Bic Camera,...).
              </p>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200">
                <strong>Cam kết hoàn tiền 200%:</strong> Nếu quý khách phát hiện bất kỳ sản phẩm nào là hàng giả, hàng nhái hoặc không đúng nguồn gốc Nhật Bản, Japan Shop cam kết hoàn lại 200% giá trị đơn hàng.
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                2. Điều kiện đổi trả hàng trong vòng 7 ngày
              </h2>
              <p>Quý khách được hỗ trợ đổi sản phẩm mới hoặc hoàn tiền trong vòng <strong>7 ngày</strong> kể từ khi nhận hàng trong các trường hợp sau:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Sản phẩm bị móp méo, bể vỡ hoặc hư hỏng do quá trình vận chuyển.</li>
                <li>Giao sai chủng loại, mã sản phẩm hoặc số lượng so với đơn đặt hàng ban đầu.</li>
                <li>Sản phẩm bị cận hạn sử dụng (dưới 3 tháng) mà không có thông báo trước cho khách hàng.</li>
                <li>Sản phẩm còn nguyên tem mác niêm phong của nhà sản xuất (đối với trường hợp khách đổi ý muốn đổi sang sản phẩm khác).</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                3. Quy trình thực hiện đổi trả
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Bước 1:</strong> Liên hệ qua Hotline/Zalo: <strong>0902 493 895</strong> hoặc Messenger của Japan Shop, cung cấp mã đơn hàng và hình ảnh/video mở hộp sản phẩm.
                </li>
                <li>
                  <strong>Bước 2:</strong> Đội ngũ chăm sóc khách hàng của chúng tôi sẽ xác nhận trong vòng 2 giờ làm việc và điều phối shipper đến thu hồi sản phẩm tại nhà hoặc gửi sản phẩm thay thế.
                </li>
                <li>
                  <strong>Bước 3:</strong> Trường hợp hoàn tiền, số tiền sẽ được chuyển khoản lại cho quý khách trong vòng 24 giờ sau khi xác nhận.
                </li>
              </ol>
            </section>

            <section className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                4. Thông tin hỗ trợ & Liên hệ
              </h2>
              <p>Mọi thắc mắc hoặc yêu cầu đổi trả, quý khách vui lòng liên hệ:</p>
              <ul className="list-none space-y-1 pl-0">
                <li><strong>Hotline / Zalo:</strong> 0902 493 895</li>
                <li><strong>Email:</strong> japanshop.tuyan78@gmail.com</li>
                <li><strong>Địa chỉ:</strong> 1017/26/18 Lê Văn Lương, Ấp 3, Nhà Bè, TP. Hồ Chí Minh</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
