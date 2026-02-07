'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
}

interface PatternLockProps {
  onChange: (pattern: number[]) => void;
  className?: string;
  error?: boolean;
  onEnd?: () => void;
}

const DOTS = Array.from({ length: 9 }, (_, i) => i + 1);
const GRID_SIZE = 3;
const DOT_RADIUS = 10;
const SENSITIVITY_RADIUS = 30;

export function PatternLock({ onChange, className, error, onEnd }: PatternLockProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [path, setPath] = useState<number[]>([]);
  const [currentLine, setCurrentLine] = useState<[Point, Point] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dotPositions, setDotPositions] = useState<Point[]>([]);

  const getDotCenter = useCallback((index: number, containerSize: number): Point => {
    const col = index % GRID_SIZE;
    const row = Math.floor(index / GRID_SIZE);
    const spacing = containerSize / (GRID_SIZE + 1);
    return {
      x: (col + 1) * spacing,
      y: (row + 1) * spacing,
    };
  }, []);

  useEffect(() => {
    const updateDotPositions = () => {
        if (svgRef.current) {
            const { width } = svgRef.current.getBoundingClientRect();
            setDotPositions(DOTS.map((_, i) => getDotCenter(i, width)));
        }
    };
    updateDotPositions();
    window.addEventListener('resize', updateDotPositions);
    return () => window.removeEventListener('resize', updateDotPositions);
  }, [getDotCenter]);
  
  const getMouseOrTouchPosition = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : null;
    return {
      x: (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left,
      y: (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top,
    };
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setPath([]);
    setIsDrawing(true);
    const pos = getMouseOrTouchPosition(e);
    if (!pos || !dotPositions.length) return;

    for (let i = 0; i < dotPositions.length; i++) {
        const dot = dotPositions[i];
        const distance = Math.sqrt(Math.pow(pos.x - dot.x, 2) + Math.pow(pos.y - dot.y, 2));
        if (distance < SENSITIVITY_RADIUS && !path.includes(i + 1)) {
            setPath([i + 1]);
            break;
        }
    }
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !dotPositions.length) return;
    e.preventDefault();
    const pos = getMouseOrTouchPosition(e);
    if (!pos) return;

    const lastDotIndex = path[path.length - 1] - 1;
    if (lastDotIndex >= 0) {
        const lastDotPos = dotPositions[lastDotIndex];
        setCurrentLine([lastDotPos, pos]);
    }
    
    for (let i = 0; i < dotPositions.length; i++) {
        const dot = dotPositions[i];
        const distance = Math.sqrt(Math.pow(pos.x - dot.x, 2) + Math.pow(pos.y - dot.y, 2));
        if (distance < SENSITIVITY_RADIUS && !path.includes(i + 1)) {
            setPath(prevPath => [...prevPath, i + 1]);
        }
    }
  };

  const handleInteractionEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    setCurrentLine(null);
    onChange(path);
    onEnd?.();
  };

  const drawnLines = [];
  for (let i = 0; i < path.length - 1; i++) {
    const fromDot = dotPositions[path[i] - 1];
    const toDot = dotPositions[path[i+1] - 1];
    if (fromDot && toDot) {
        drawnLines.push(
            <line key={`line-${i}`} x1={fromDot.x} y1={fromDot.y} x2={toDot.x} y2={toDot.y} className={cn('stroke-primary/50', {'stroke-destructive': error})} strokeWidth="4" />
        );
    }
  }
  
  return (
    <div className={cn("aspect-square w-full max-w-xs mx-auto touch-none", className)}>
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseDown={handleInteractionStart}
            onMouseMove={handleInteractionMove}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchMove={handleInteractionMove}
            onTouchEnd={handleInteractionEnd}
            className="cursor-pointer"
        >
            {dotPositions.length > 0 && (
                <>
                    {drawnLines}
                    {isDrawing && currentLine && (
                        <line x1={currentLine[0].x} y1={currentLine[0].y} x2={currentLine[1].x} y2={currentLine[1].y} className={cn('stroke-primary/50', {'stroke-destructive': error})} strokeWidth="4" />
                    )}
                    {DOTS.map((_, i) => {
                        const pos = dotPositions[i];
                        const isSelected = path.includes(i + 1);
                        return (
                            <g key={i}>
                                <circle cx={pos.x} cy={pos.y} r={SENSITIVITY_RADIUS} fill="transparent" />
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={isSelected ? DOT_RADIUS + 2 : DOT_RADIUS}
                                    className={cn(
                                        'fill-muted-foreground/50 transition-all',
                                        { 'fill-primary': isSelected, 'fill-destructive': isSelected && error }
                                    )}
                                />
                            </g>
                        );
                    })}
                </>
            )}
        </svg>
    </div>
  );
}
