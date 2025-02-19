import * as React from "react"
import { cn } from "@/lib/utils"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 208 352" 
      className={cn("fill-none", className)} 
      {...props}
    >
      <style>
        {`
          .broken { 
            stroke-dasharray: 8;
          }
          .solid {
            stroke-width: 8;
            stroke-linecap: round;
            stroke-linejoin: miter;
          }
        `}
      </style>
      <g>
        <line x1="80" y1="16" x2="120" y2="16" className="solid" />
        <line x1="80" y1="16" x2="76" y2="24" className="solid" />
        <line x1="76" y1="24" x2="76" y2="80" className="broken" />
        <line x1="80" y1="16" x2="96" y2="48" className="solid" />
        <line x1="84" y1="24" x2="84" y2="64" className="broken" />
        <line x1="120" y1="16" x2="136" y2="48" className="solid" />
        <line x1="96" y1="48" x2="136" y2="48" className="solid" />
        <line x1="96" y1="48" x2="64" y2="112" className="solid" />
        <line x1="136" y1="48" x2="104" y2="112" className="solid" />
        <line x1="64" y1="112" x2="104" y2="112" className="solid" />
        <line x1="64" y1="112" x2="112" y2="208" className="solid" />
        <line x1="68" y1="120" x2="68" y2="176" className="broken" />
        <line x1="104" y1="112" x2="128" y2="160" className="solid" />
        <line x1="76" y1="136" x2="76" y2="192" className="broken" />
        <line x1="84" y1="152" x2="84" y2="208" className="broken" />
        <line x1="92" y1="168" x2="92" y2="224" className="broken" />
        <line x1="100" y1="184" x2="100" y2="288" className="broken" />
        <line x1="108" y1="200" x2="108" y2="272" className="broken" />
      </g>
      <g>
        <line x1="72" y1="32" x2="68" y2="40" className="solid" />
        <line x1="68" y1="40" x2="68" y2="96" className="broken" />
      </g>
      <g>
        <line x1="64" y1="48" x2="60" y2="56" className="solid" />
        <line x1="60" y1="56" x2="60" y2="160" className="broken" />
      </g>
      <g>
        <line x1="56" y1="64" x2="52" y2="72" className="solid" />
        <line x1="52" y1="72" x2="52" y2="144" className="broken" />
      </g>
      <g>
        <line x1="48" y1="80" x2="44" y2="88" className="solid" />
        <line x1="44" y1="88" x2="44" y2="144" className="broken" />
      </g>
      <g>
        <line x1="40" y1="96" x2="36" y2="104" className="solid" />
        <line x1="36" y1="104" x2="36" y2="160" className="broken" />
      </g>
      <g>
        <line x1="32" y1="112" x2="28" y2="120" className="solid" />
        <line x1="28" y1="120" x2="28" y2="176" className="broken" />
      </g>
      <g>
        <line x1="24" y1="128" x2="20" y2="136" className="solid" />
        <line x1="20" y1="136" x2="20" y2="192" className="broken" />
      </g>
      <g>
        <line x1="144" y1="144" x2="184" y2="144" className="solid" />
        <line x1="144" y1="144" x2="140" y2="152" className="solid" />
        <line x1="140" y1="152" x2="140" y2="208" className="broken" />
        <line x1="144" y1="144" x2="160" y2="176" className="solid" />
        <line x1="148" y1="152" x2="148" y2="192" className="broken" />
        <line x1="184" y1="144" x2="200" y2="176" className="solid" />
        <line x1="160" y1="176" x2="200" y2="176" className="solid" />
        <line x1="160" y1="176" x2="96" y2="304" className="solid" />
        <line x1="200" y1="176" x2="136" y2="304" className="solid" />
        <line x1="136" y1="304" x2="120" y2="336" className="solid" />
        <line x1="72" y1="288" x2="64" y2="304" className="solid" />
        <line x1="64" y1="304" x2="80" y2="336" className="solid" />
        <line x1="96" y1="304" x2="80" y2="336" className="solid" />
        <line x1="80" y1="336" x2="120" y2="336" className="solid" />
      </g>
      <g>
        <line x1="16" y1="144" x2="12" y2="152" className="solid" />
        <line x1="12" y1="152" x2="12" y2="192" className="broken" />
      </g>
      <g>
        <line x1="48" y1="144" x2="16" y2="208" className="solid" />
        <line x1="48" y1="144" x2="96" y2="240" className="solid" />
        <line x1="96" y1="240" x2="92" y2="248" className="solid" />
        <line x1="92" y1="248" x2="92" y2="304" className="broken" />
        <line x1="8" y1="160" x2="0" y2="176" className="solid" />
        <line x1="0" y1="176" x2="16" y2="208" className="solid" />
        <line x1="16" y1="208" x2="56" y2="208" className="solid" />
        <line x1="64" y1="192" x2="56" y2="208" className="solid" />
      </g>
      <g>
        <line x1="136" y1="160" x2="132" y2="168" className="solid" />
        <line x1="132" y1="168" x2="132" y2="224" className="broken" />
      </g>
      <g>
        <line x1="128" y1="176" x2="124" y2="184" className="solid" />
        <line x1="124" y1="184" x2="124" y2="240" className="broken" />
      </g>
      <g>
        <line x1="120" y1="192" x2="116" y2="200" className="solid" />
        <line x1="116" y1="200" x2="116" y2="256" className="broken" />
      </g>
      <g>
        <line x1="88" y1="256" x2="84" y2="264" className="solid" />
        <line x1="84" y1="264" x2="84" y2="320" className="broken" />
      </g>
      <g>
        <line x1="80" y1="272" x2="76" y2="280" className="solid" />
        <line x1="76" y1="280" x2="76" y2="320" className="broken" />
      </g>
    </svg>
  )
} 