export default function YarnMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="16" cy="16" r="14" fill="#EADFF9" />
      <path
        d="M4 16c4-4 8 4 12 0s8-4 12 0"
        stroke="#A996D6"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 11c4-3 7 5 11 2s7-5 11-2"
        stroke="#8874C2"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M6 21c4-3 7 5 11 2s7-5 11-2"
        stroke="#F3C9D4"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
