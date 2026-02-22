import type { SVGProps } from 'react';

export function NeetProgressLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      width="1em"
      height="1em"
      {...props}
    >
      <defs>
        <radialGradient id="logo-gradient-1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.5)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
        </radialGradient>
        <linearGradient id="logo-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <g className="animate-float">
        <circle cx="50" cy="50" r="50" fill="url(#logo-gradient-1)" />
        <g className="animate-[spin_20s_linear_infinite]">
          <path d="M 50,5 A 45,45 0 0 1 95,50" fill="none" stroke="hsl(var(--primary) / 0.8)" strokeWidth="2" />
        </g>
        <g className="animate-[spin_15s_linear_infinite_reverse]">
          <path d="M 5,50 A 45,45 0 0 1 50,95" fill="none" stroke="hsl(var(--accent) / 0.7)" strokeWidth="1.5" />
        </g>
         <g className="animate-[spin_25s_linear_infinite]">
          <path d="M 95, 50 A 45,45 0 0 1 50, 5" fill="none" stroke="hsl(var(--foreground) / 0.2)" strokeWidth="1" strokeDasharray="2 4" />
        </g>
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontSize="48"
          fontWeight="bold"
          fill="url(#logo-gradient-2)"
        >
          A
        </text>
      </g>
    </svg>
  );
}
