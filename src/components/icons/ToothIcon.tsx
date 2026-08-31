import { IconProps } from "./type";

export default function ToothIcon({ className = "h-6 w-6", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 10c0-3.5 2.5-6.5 7.5-6.5s7.5 3 7.5 6.5c0 4-1.5 7.5-3 10.5-1 2-2 2-3.5 0-1-1.5-1-2.5-1-2.5s0 1-1 2.5c-1.5 2-2.5 2-3.5 0-1.5-3-3-6.5-3-10.5Z" />
    </svg>
  );
}
