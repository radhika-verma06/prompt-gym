import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export const PlayIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 4.8c0-.8.9-1.2 1.5-.8l9.3 6.4c.6.4.6 1.3 0 1.7l-9.3 6.4c-.6.4-1.5 0-1.5-.8V4.8Z" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const CrossIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const LoopIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 10a8 8 0 0 1 13.6-3.6L20 9" />
    <path d="M20 4v5h-5" />
    <path d="M20 14a8 8 0 0 1-13.6 3.6L4 15" />
    <path d="M4 20v-5h5" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5L10.1 13 4.5 11l5.6-2L12 3.5Z" />
  </svg>
);

export const BulbIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 17h6" />
    <path d="M10 20h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V17h5.4v-1.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
  </svg>
);

export const BracesIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 4c-2 0-2 3-2 4s0 3-2 4c2 1 2 3 2 4s0 4 2 4" />
    <path d="M16 4c2 0 2 3 2 4s0 3 2 4c-2 1-2 3-2 4s0 4-2 4" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3 5 6v6c0 4.3 3 7.4 7 9 4-1.6 7-4.7 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ScissorsIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="6.5" cy="17.5" r="3" />
    <circle cx="6.5" cy="6.5" r="3" />
    <path d="m8.7 8.3 11 10.4M19.7 5.3 8.7 15.7" />
  </svg>
);

export const TargetIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const DownloadIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4.5 20h15" />
  </svg>
);

export const CopyIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </svg>
);

export const ChevronIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const RefreshIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L20 9" />
    <path d="M20 4.5V9h-4.5" />
    <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4 15" />
    <path d="M4 19.5V15h4.5" />
  </svg>
);

export const GaugeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="m12 14 4-4" />
    <circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const TrophyIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" />
    <path d="M12 13v4M9 20h6" />
  </svg>
);

export const QuestionIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.1a2.6 2.6 0 1 1 3.4 2.6c-.7.3-1 .8-1 1.6v.4" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const InfoIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="5" y="10" width="14" height="10" rx="2.5" />
    <path d="M8.5 10V8a3.5 3.5 0 1 1 7 0v2" />
  </svg>
);
