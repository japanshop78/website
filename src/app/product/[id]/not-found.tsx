import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-32 bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-indigo-600 dark:text-indigo-400">404</p>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">
          Không tìm thấy sản phẩm
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xoá.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
