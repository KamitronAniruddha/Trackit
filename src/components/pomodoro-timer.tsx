
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Settings, Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

const playBeep = () => {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
};

export function PomodoroTimer() {
    const [durations, setDurations] = useLocalStorage('pomodoro-durations', { work: 25, shortBreak: 5, longBreak: 15 });
    const [mode, setMode] = useState<Mode>('work');
    const [time, setTime] = useState(durations.work * 60);
    const [isActive, setIsActive] = useState(false);
    const [pomodoros, setPomodoros] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const { toast } = useToast();

    const switchMode = useCallback((newMode: Mode) => {
        setIsActive(false);
        setMode(newMode);
        setTime(durations[newMode] * 60);
    }, [durations]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime(t => t - 1);
            }, 1000);
        } else if (isActive && time === 0) {
            playBeep();
            if (mode === 'work') {
                const newPomodoroCount = pomodoros + 1;
                setPomodoros(newPomodoroCount);
                toast({ title: "Work session finished!", description: "Time for a break." });
                if (newPomodoroCount % 4 === 0) {
                    switchMode('longBreak');
                } else {
                    switchMode('shortBreak');
                }
            } else {
                toast({ title: "Break's over!", description: "Time to get back to work." });
                switchMode('work');
            }
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time, mode, pomodoros, toast, switchMode]);

    const resetTimer = () => {
        setIsActive(false);
        setTime(durations[mode] * 60);
    };

    const handleDurationChange = (type: keyof typeof durations, value: number) => {
        const newDurations = { ...durations, [type]: value };
        setDurations(newDurations);
        if (mode === type) {
            setTime(value * 60);
            setIsActive(false);
        }
    };
    
    const displayTime = formatTime(time);
    
    useEffect(() => {
        document.title = `${displayTime} - ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    }, [displayTime, mode]);

    return (
        <Card className="max-w-xl mx-auto w-full bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Study Timer</CardTitle>
                <CardDescription>Stay focused and manage your study time effectively.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-8">
                <Tabs value={mode} onValueChange={(value) => switchMode(value as Mode)} className="w-[300px] sm:w-[400px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="work">Work</TabsTrigger>
                        <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                        <TabsTrigger value="longBreak">Long Break</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-full flex items-center justify-center text-center">
                    <div className="absolute inset-0 bg-muted/30 rounded-full"></div>
                    <div className="absolute inset-2 border-4 border-dashed border-primary/20 rounded-full animate-spin [animation-duration:30s]"></div>
                    <div className="relative z-10">
                        <p className="text-6xl sm:text-8xl font-bold font-mono tracking-tighter text-foreground">{displayTime}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsActive(!isActive)} size="lg" className="w-40">
                        {isActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="lg">
                        <RotateCcw className="mr-2"/>
                        Reset
                    </Button>
                </div>

                <div className="flex items-center justify-between w-full max-w-sm pt-4 border-t border-border/50">
                    <p className="text-lg font-semibold">Pomodoros: <span className="text-primary">{pomodoros}</span></p>
                     <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Settings/></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Timer Settings</DialogTitle>
                                <DialogDescription>
                                    Adjust the duration for each session in minutes.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <DurationInput label="Work" value={durations.work} onChange={(v) => handleDurationChange('work', v)} />
                                <DurationInput label="Short Break" value={durations.shortBreak} onChange={(v) => handleDurationChange('shortBreak', v)} />
                                <DurationInput label="Long Break" value={durations.longBreak} onChange={(v) => handleDurationChange('longBreak', v)} />
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setIsSettingsOpen(false)}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

const DurationInput = ({ label, value, onChange }: { label: string, value: number, onChange: (value: number) => void }) => {
    return (
        <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor={label.toLowerCase()} className="text-right">
                {label}
            </Label>
            <div className="col-span-2 flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onChange(Math.max(1, value - 1))}><Minus/></Button>
                <Input id={label.toLowerCase()} type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="col-span-2 h-8 text-center" />
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onChange(value + 1)}><Plus/></Button>
            </div>
        </div>
    );
}
