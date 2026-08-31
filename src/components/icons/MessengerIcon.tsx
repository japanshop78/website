import { IconProps } from "./type";

export default function MessengerIcon({ className = "h-6 w-6", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.215V22l3.39-1.86c.928.257 1.91.397 2.875.397 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.443l-2.617-2.793-5.109 2.793 5.617-5.965 2.684 2.793 5.042-2.793-5.617 5.965z" />
    </svg>
  );
}
