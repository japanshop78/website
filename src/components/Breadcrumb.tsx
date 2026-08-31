import Link from "next/link";
import ChevronRightIcon from "./icons/ChevronRightIcon";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-zinc-400 shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`${
                  isLast
                    ? "font-medium text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-md"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
