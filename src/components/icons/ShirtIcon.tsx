import { IconProps } from "./type";

export default function ShirtIcon({ className = "h-6 w-6", ...props }: IconProps) {
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
      <path d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.1V10.5m-3.5 13.5h7m-7 0L5 12h8m-8 0l1.25-6.25a1.125 1.125 0 011.1-.9H16.65a1.125 1.125 0 011.1.9L19 12h-8" />
    </svg>
  );
}
