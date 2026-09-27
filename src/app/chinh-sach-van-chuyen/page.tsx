import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "Chính Sách Vận Chuyển & Kiểm Hàng - Japan Shop",
  description: "Thông tin thời gian giao hàng, biểu phí vận chuyển và quyền kiểm tra hàng trước khi thanh toán tại Japan Shop.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Chính sách vận chuyển & kiểm hàng" },
          ]}
        />

        <div className="mt-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-3">
              Giao hàng toàn quốc
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              Chính Sách Vận Chuyển & Kiểm Hàng
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Quy định về thời gian giao hàng, phí vận chuyển và quyền lợi kiểm tra hàng trước khi nhận
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                1. Quyền kiểm tra hàng trước khi thanh toán (Đồng kiểm)
              </h2>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200">
                <strong>100% khách hàng được kiểm tra hàng trước:</strong> Khi nhân viên giao hàng (shipper) tới, quý khách có toàn quyền mở gói hàng kiểm tra đúng sản phẩm, số lượng, quy cách đóng gói và hạn sử dụng trước khi thanh toán tiền mặt (COD).
              </div>
              <p>
                Nếu sản phẩm không đúng như đơn đặt hoặc có dấu hiệu hư hại trong lúc vận chuyển, quý khách có quyền từ chối nhận hàng mà không phải chịu bất kỳ chi phí nào.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                2. Phí vận chuyển (Shipping Fee)
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>MIỄN PHÍ VẬN CHUYỂN:</strong> Áp dụng cho tất cả đơn hàng có tổng giá trị từ <strong>500.000đ</strong> trở lên trên toàn quốc.
                </li>
                <li>
                  <strong>Đơn hàng dưới 500.000đ:</strong> Áp dụng mức phí vận chuyển đồng giá ưu đãi chỉ <strong>25.000đ</strong> cho toàn bộ các tỉnh thành.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                3. Thời gian giao hàng dự kiến
              </h2>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="p-3 font-bold text-zinc-900 dark:text-white">Khu vực</th>
                      <th className="p-3 font-bold text-zinc-900 dark:text-white">Thời gian dự kiến</th>
                      <th className="p-3 font-bold text-zinc-900 dark:text-white">Hình thức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    <tr>
                      <td className="p-3 font-medium">Nội thành TP. Hồ Chí Minh</td>
                      <td className="p-3">Trong ngày hoặc 24 giờ</td>
                      <td className="p-3">Giao hỏa tốc / Tiêu chuẩn</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Hà Nội & Các tỉnh miền Nam</td>
                      <td className="p-3">1 - 2 ngày làm việc</td>
                      <td className="p-3">Chuyển phát nhanh đường bay</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Các tỉnh Miền Trung & Miền Bắc</td>
                      <td className="p-3">2 - 3 ngày làm việc</td>
                      <td className="p-3">Chuyển phát nhanh EMS/Viettel Post</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                4. Theo dõi hành trình đơn hàng
              </h2>
              <p>
                Sau khi đơn hàng được gửi đi, shop sẽ gửi mã vận đơn qua Zalo hoặc SMS để quý khách chủ động theo dõi thời gian giao nhận. Mọi yêu cầu giao gấp xin liên hệ trực tiếp hotline: <strong>0902 493 895</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
