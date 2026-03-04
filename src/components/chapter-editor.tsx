'use client';

import { useProgress, type ChapterProgress } from '@/hooks/use-progress';
import type { Subject } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';
import { History, Clock, CheckCircle2 } from 'lucide-react';
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
      return [{ '--slider-color': 'hsl(var(--destructive))' } as React.CSSProperties, 'text-destructive'];
    }
    if (confidence <= 70) {
      return [{ '--slider-color': 'hsl(var(--chart-4))' } as React.CSSProperties, 'text-[hsl(var(--chart-4))]'];
    }
    return [{ '--slider-color': 'hsl(142.1, 76.2%, 36.3%)' } as React.CSSProperties, 'text-[hsl(142.1,76.2%,36.3%)]'];
  };

  const [confidenceStyle, confidenceTextColor] = getConfidenceStyle(localConfidence);

  if (!isLoaded || !chapterData) {
    return null;
  }
  
  const isCompleted = chapterData?.completed ?? false;

  return (
    <Card
      className={cn(
        "flex flex-col justify-between transition-all duration-300 ease-in-out border-primary/10 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur-sm relative",
        isCompleted && "bg-green-500/10 border-green-500/20"
      )}
    >
      {isCompleted && (
          <div className="absolute top-3 right-3 p-1.5 bg-green-500/20 rounded-full text-green-500">
              <CheckCircle2 className="h-5 w-5" />
          </div>
      )}
      <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{subject.replace('-', ' ')}</p>
          <CardTitle className="text-lg font-bold text-foreground leading-tight">{chapter}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-0 pb-4">
        <div className="space-y-2">
          <div className={cn("flex justify-between items-center text-xs transition-opacity", !isCompleted && "opacity-50")}>
              <Label htmlFor={`confidence-${chapter}`} className="font-medium text-muted-foreground">Confidence</Label>
              <span className={cn("font-mono w-10 text-right font-semibold", confidenceTextColor)}>{localConfidence}%</span>
          </div>
          <div style={confidenceStyle}>
            <Slider
                id={`confidence-${chapter}`}
                min={0}
                max={100}
                step={1}
                value={[localConfidence]}
                onValueChange={(value) => setLocalConfidence(value[0])}
                onPointerDownCapture={(e) => e.stopPropagation()}
                aria-label={`Confidence for ${chapter}`}
                disabled={!isCompleted}
            />
          </div>
        </div>
      </CardContent>
      
      <div className="flex items-center justify-between bg-muted/20 p-3 mt-auto rounded-b-lg">
          <div className="flex items-center gap-2">
              <Label htmlFor={`questions-${chapter}`} className="text-xs font-medium text-muted-foreground">MCQs</Label>
              <Input
                  id={`questions-${chapter}`}
                  type="number"
                  min="0"
                  className="w-16 h-8 text-center bg-background/50"
                  placeholder="0"
                  value={chapterData?.questions ?? ''}
                  onChange={(e) => handleUpdate({ questions: parseInt(e.target.value, 10) || 0 })}
                  aria-label={`Questions for ${chapter}`}
                  disabled={isCompleted}
              />
          </div>

        <div className="flex items-center gap-3">
             <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:bg-accent/50">
                          <History className='mr-1.5 h-4 w-4' />
                          <span className="font-semibold">{chapterData?.revisions?.length || 0}</span>
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
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
                      <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => handleRevision()}>
                          Log New Revision
                      </Button>
                  </PopoverContent>
              </Popover>

              <Switch
                  id={`switch-${chapter}`}
                  checked={isCompleted}
                  onCheckedChange={(checked) => handleUpdate({ completed: checked })}
                  aria-label={`Mark ${chapter} as completed`}
              />
        </div>
      </div>
    </Card>
  );
}
