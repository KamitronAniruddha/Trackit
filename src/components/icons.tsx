import type { SVGProps } from 'react';

export function NeetProgressLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width="1em"
      height="1em"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        fontFamily="cursive"
        fontSize="110"
        fontWeight="bold"
        fill="url(#logo-gradient)"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1"
        paintOrder="stroke"
      >
        Ani
      </text>
    </svg>
  );
}
