import { IconProps } from "./type";

export default function FilterIcon({ className = "h-5 w-5", ...props }: IconProps) {
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
      <path d="M3 4.5h18m-15 7.5h12m-9 7.5h6" />
    </svg>
  );
}
