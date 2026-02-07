'use client';

import { useProgress, type ChapterProgress } from '@/hooks/use-progress';
import type { Subject } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';
import { History, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChapterEditorProps {
  subject: Subject;
  chapter: string;
}

export function ChapterEditor({ subject, chapter }: ChapterEditorProps) {
  const { progress, updateProgress, isLoaded } = useProgress();
  const chapterData = progress[subject]?.[chapter];
  
  const [localConfidence, setLocalConfidence] = useState(chapterData?.confidence ?? 50);

  // Update local state if the progress from context changes
  useEffect(() => {
    if (chapterData) {
      setLocalConfidence(chapterData.confidence);
    }
  }, [chapterData]);

  // Debounce the Firestore update for confidence changes
  useEffect(() => {
    if (chapterData && localConfidence !== chapterData.confidence) {
      const handler = setTimeout(() => {
        updateProgress(subject, chapter, { confidence: localConfidence });
      }, 300); // 300ms delay

      return () => {
        clearTimeout(handler);
      };
    }
  }, [localConfidence, chapter, subject, updateProgress, chapterData]);
  
  const handleUpdate = (values: Partial<ChapterProgress>) => {
    updateProgress(subject, chapter, values);
  };
  
  const handleRevision = () => {
    const newRevisions = [...(chapterData?.revisions || []), Date.now()];
    updateProgress(subject, chapter, { revisions: newRevisions });
  };

  const getConfidenceStyle = (confidence: number): [React.CSSProperties, string] => {
    if (confidence <= 40) {
      return [{ '--slider-color': 'var(--destructive)' } as React.CSSProperties, 'text-destructive'];
    }
    if (confidence <= 70) {
      return [{ '--slider-color': 'var(--chart-4)' } as React.CSSProperties, 'text-[hsl(var(--chart-4))]'];
    }
    const greenHsl = '130 60% 45%';
    return [{ '--slider-color': greenHsl } as React.CSSProperties, 'text-[hsl(130,60%,45%)]'];
  };

  const [confidenceStyle, confidenceTextColor] = getConfidenceStyle(localConfidence);

  if (!isLoaded || !chapterData) {
    return null; // Or a skeleton
  }

  return (
    <Card
      className="flex flex-col justify-between p-5 transition-all duration-300 ease-in-out border-primary/10 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur-sm data-[completed=true]:border-accent/50 data-[completed=true]:bg-accent/10"
      data-completed={chapterData?.completed}
    >
      <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{subject.replace('-', ' ')}</p>
          <h3 className="font-bold mt-1 text-xl text-foreground">{chapter}</h3>
      </div>

      <div className="space-y-5 mt-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
              <Label htmlFor={`confidence-${chapter}`} className="text-sm font-medium">Confidence</Label>
              <span className={cn("text-sm font-mono w-10 text-right font-semibold transition-colors duration-300", confidenceTextColor)}>{localConfidence}%</span>
          </div>
          <div style={confidenceStyle}>
            <Slider
                id={`confidence-${chapter}`}
                min={0}
                max={100}
                step={1}
                value={[localConfidence]}
                onValueChange={(value) => setLocalConfidence(value[0])}
                aria-label={`Confidence for ${chapter}`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <Label htmlFor={`questions-${chapter}`} className="text-sm font-medium">MCQs</Label>
              <Input
                  id={`questions-${chapter}`}
                  type="number"
                  min="0"
                  className="w-20 h-9 bg-background/50 border-border/80"
                  placeholder="0"
                  value={chapterData?.questions ?? ''}
                  onChange={(e) => handleUpdate({ questions: parseInt(e.target.value, 10) || 0 })}
                  aria-label={`Questions for ${chapter}`}
              />
          </div>
          <div className="flex items-center gap-3">
              <Label htmlFor={`switch-${chapter}`} className="text-sm font-medium">Done</Label>
              <Switch
                  id={`switch-${chapter}`}
                  checked={chapterData?.completed ?? false}
                  onCheckedChange={(checked) => handleUpdate({ completed: checked })}
                  aria-label={`Mark ${chapter} as completed`}
              />
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-3 space-y-2">
          <div className="flex justify-between items-center">
              <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="link" size="sm" className="text-sm text-muted-foreground p-0 h-auto decoration-dashed hover:decoration-solid">
                          Revisions: <span className='font-bold text-foreground ml-1'>{chapterData?.revisions?.length || 0}</span>
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                      <h4 className="font-semibold text-center mb-3">Revision History</h4>
                      <ScrollArea className="h-48">
                          {chapterData?.revisions && chapterData.revisions.length > 0 ? (
                              <div className="space-y-3">
                                  {chapterData.revisions.slice().reverse().map((timestamp, index) => (
                                      <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                          <Clock className="h-3 w-3 shrink-0" />
                                          <span>{format(new Date(timestamp), "PPp")}</span>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No revisions yet.</p>
                          )}
                      </ScrollArea>
                  </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="sm" onClick={() => handleRevision()}>
                  <History className='mr-2 h-4 w-4' />
                  Revise Now
              </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
