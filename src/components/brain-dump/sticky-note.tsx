
'use client';
import { useState, useEffect, useMemo } from 'react';
import type { BrainDumpNote } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const pastelColors = [
    'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800/30',
    'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/30',
    'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/30',
    'bg-pink-100 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800/30',
    'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/30',
];

const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1', 'rotate-3', '-rotate-3'];

export function StickyNote({ note }: { note: BrainDumpNote }) {
    const [opacity, setOpacity] = useState(1);
    
    const color = useMemo(() => pastelColors[note.id.charCodeAt(0) % pastelColors.length], [note.id]);
    const rotation = useMemo(() => rotations[note.id.charCodeAt(1) % rotations.length], [note.id]);

    useEffect(() => {
        const calculateOpacity = () => {
            const now = Date.now();
            const expires = note.expiresAt.toDate().getTime();
            const created = note.createdAt.toDate().getTime();
            const timeRemaining = expires - now;

            // Start fading in the last 6 hours
            const fadeDuration = 6 * 60 * 60 * 1000;

            if (timeRemaining <= 0) {
                return 0;
            }
            if (timeRemaining < fadeDuration) {
                // Return a value from 1 down to 0
                return timeRemaining / fadeDuration;
            }
            
            return 1;
        };

        setOpacity(calculateOpacity());

        const interval = setInterval(() => {
            setOpacity(calculateOpacity());
        }, 60000); // Update every minute for smooth fading

        return () => clearInterval(interval);
    }, [note.createdAt, note.expiresAt]);

    if (opacity === 0) return null;
    
    const moodEmojis = {
        stressed: '😥', tired: '😴', confused: '🤔', calm: '😌', motivated: '🔥'
    };

    return (
        <div
            className={cn(
                'p-4 rounded-md shadow-lg transition-all duration-500',
                color,
                rotation
            )}
            style={{ opacity: opacity, transition: 'opacity 1s linear' }}
        >
            <p className="text-base text-foreground/80 whitespace-pre-wrap break-words font-serif">{note.text}</p>
            <div className="flex justify-between items-center mt-4 pt-2 border-t border-black/10 dark:border-white/10">
                <span className="text-2xl">{moodEmojis[note.mood]}</span>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true })}</p>
            </div>
        </div>
    );
}
