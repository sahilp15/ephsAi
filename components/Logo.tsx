import { brand } from "@/config/brand";

type LogoProps = {
  /** Pixel size of the mark (square). */
  size?: number;
  /** Show the "EPHS AI" wordmark next to the mark. */
  showWordmark?: boolean;
  className?: string;
};

/**
 * EPHS AI wordmark + mark.
 *
 * The mark is an ORIGINAL, simple eagle-feather silhouette drawn from scratch.
 * It intentionally does NOT copy any real Eden Prairie High School logo or
 * trademarked imagery.
 */
export function Logo({ size = 32, showWordmark = true, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label={`${brand.name} logo`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="24" fill={brand.colors.scarlet} />
        {/* Stylized eagle feather (original artwork). */}
        <path
          d="M34 13C26 15 19 22 16.5 32c-.5 2-.8 4-1 6 1.8-1.2 3.4-2.6 4.8-4.1 3.6.1 6.8-1 9.2-3.4C36 25 35.5 18 34 13Z"
          fill="#FFFFFF"
        />
        <path
          d="M30.5 18.5c-2.4 1.2-4.5 2.9-6.2 5m4.6.2c-2.3.9-4.3 2.3-5.9 4.2m4.2.8c-1.7.4-3.2 1.2-4.5 2.4"
          stroke={brand.colors.scarlet}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M15.5 34.5 12 38"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-ink">
          {brand.shortName}
        </span>
      )}
    </span>
  );
}
