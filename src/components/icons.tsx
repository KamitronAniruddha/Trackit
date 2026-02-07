import type { SVGProps } from 'react';

export function NeetProgressLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="1em"
      height="1em"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <path
        fill="url(#logo-gradient)"
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm-48,80H112v48a8,8,0,0,1-16,0V80a8,8,0,0,1,8-8h56a8,8,0,0,1,0,16H112v24h48a8,8,0,0,1,0,16Z"
      ></path>
    </svg>
  );
}
