import './Logo.css'

export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Voltrix"
    >
      {/* outer ring */}
      <circle cx="32" cy="32" r="30" stroke="#00c853" strokeWidth="2" opacity="0.35" />
      {/* core hex */}
      <path
        d="M32 10 L48 20 L48 40 L32 50 L16 40 L16 20 Z"
        stroke="#00c853"
        strokeWidth="2.2"
        fill="rgba(0,200,83,0.12)"
      />
      {/* V mark */}
      <path
        d="M22 26 L32 42 L42 26"
        stroke="#e7e9ea"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* pulse dot */}
      <circle cx="32" cy="32" r="3.5" fill="#00c853">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}