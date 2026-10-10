import Link from "next/link";
import { MessengerIcon, ZaloIcon } from "@/components/icons";

export default function MessengerFloatingButton() {
  return (
    <aside
      aria-label="Hỗ trợ trực tuyến"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 sm:gap-4"
    >
      {/* Nút Chat Zalo (Nằm trên) */}
      <div className="flex items-center group">
        <span className="hidden sm:inline-block pointer-events-none mr-3 rounded-full bg-zinc-900/90 dark:bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0 whitespace-nowrap">
          Chat qua Zalo
        </span>

        <Link
          href="https://zalo.me/0902493895"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat với shop qua Zalo"
          title="Chat với shop qua Zalo (0902493895)"
          className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#0068FF] text-white shadow-xl shadow-blue-600/40 hover:shadow-2xl hover:shadow-blue-600/60 hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#0068FF] opacity-25" />
          <ZaloIcon className="h-10 w-10 sm:h-14 sm:w-14 text-white drop-shadow-sm" />
        </Link>
      </div>

      {/* Nút Chat Messenger (Nằm dưới) */}
      <div className="flex items-center group">
        <span className="hidden sm:inline-block pointer-events-none mr-3 rounded-full bg-zinc-900/90 dark:bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0 whitespace-nowrap">
          Chat qua Messenger
        </span>

        <Link
          href="https://www.messenger.com/t/108292607259915"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat với shop qua Facebook Messenger"
          title="Chat với shop qua Messenger"
          className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#0066FF] via-[#0084FF] to-[#00B2FE] text-white shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-500 opacity-25" />
          <MessengerIcon className="h-10 w-10 sm:h-14 sm:w-14 text-white drop-shadow-sm" />
        </Link>
      </div>
    </aside>
  );
}

