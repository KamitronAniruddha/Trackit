
'use client';

import { useProgress } from '@/hooks/use-progress';
import { useSyllabus } from '@/contexts/syllabus-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { Loader2, CheckCircle2, Target, BrainCircuit, ListChecks, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { Subject } from '@/lib/types';
import { ALL_SUBJECTS } from '@/lib/neet-syllabus';
import { Button } from './ui/button';
import { ProgressPdfLayout } from './progress-pdf-layout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

export function InterpretationCharts() {
  const { progress, isLoaded: progressLoaded } = useProgress();
  const { syllabuses, loading: syllabusLoading } = useSyllabus();
  const { profile, loading: profileLoading } = useUserProfile();

  const [isDownloading, setIsDownloading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [pdfContent, setPdfContent] = useState<any | null>(null);

  const chartData = useMemo(() => {
    if (!profile || !syllabuses || !progress) return null;

    const examSyllabus = syllabuses[profile.exam!];
    if (!examSyllabus) return null;

    let totalChapters = 0;
    let completedChapters = 0;
    let totalConfidence = 0;
    let chaptersWithProgress = 0;
    let totalMcqs = 0;
    let totalRevisions = 0;

    const subjectMetrics: { 
        subject: string, 
        name: string, 
        completion: number, 
        total: number, 
        completed: number,
        avgConfidence: number,
        totalMcqs: number,
    }[] = [];
    
    const subjectsForExam = Object.keys(examSyllabus) as Subject[];
    
    const chemSubjects: Subject[] = ['physical-chemistry', 'organic-chemistry', 'inorganic-chemistry'];
    let chemTotalChapters = 0;
    let chemCompletedChapters = 0;
    let chemTotalConfidence = 0;
    let chemChaptersWithProgress = 0;
    let chemTotalMcqs = 0;
    let hasChemistry = false;

    for (const subject of subjectsForExam) {
        if (subject === 'chemistry') continue; 
        
        if (chemSubjects.includes(subject)) {
            hasChemistry = true;
            const subjectProgress = progress[subject];
            const syllabusChapters = examSyllabus[subject]?.chapters || [];
            const subjectTotalChapters = syllabusChapters.length;
            if(subjectTotalChapters === 0) continue;

            chemTotalChapters += subjectTotalChapters;

            if (subjectProgress) {
                for (const chapter of syllabusChapters) {
                    const chapterData = subjectProgress[chapter];
                    if (chapterData) {
                        if(chapterData.completed) {
                            chemCompletedChapters++;
                        }
                        chemTotalConfidence += chapterData.confidence || 0;
                        chemChaptersWithProgress++;
                        chemTotalMcqs += chapterData.questions || 0;
                        totalRevisions += chapterData.revisions?.length || 0;
                    }
                }
            }
            continue; 
        }

        const subjectProgress = progress[subject];
        const syllabusChapters = examSyllabus[subject]?.chapters || [];
        const subjectTotalChapters = syllabusChapters.length;
        if(subjectTotalChapters === 0) continue;

        let subjectCompleted = 0;
        let subjectTotalConfidence = 0;
        let subjectChaptersWithProgress = 0;
        let subjectTotalMcqs = 0;

        if (subjectProgress) {
            for (const chapter of syllabusChapters) {
                const chapterData = subjectProgress[chapter];
                if (chapterData) {
                    if(chapterData.completed) {
                        subjectCompleted++;
                    }
                    subjectTotalConfidence += chapterData.confidence || 0;
                    subjectChaptersWithProgress++;
                    subjectTotalMcqs += chapterData.questions || 0;
                    totalRevisions += chapterData.revisions?.length || 0;
                }
            }
        }

        totalChapters += subjectTotalChapters;
        completedChapters += subjectCompleted;
        totalConfidence += subjectTotalConfidence;
        chaptersWithProgress += subjectChaptersWithProgress;
        totalMcqs += subjectTotalMcqs;
        
        const name = subject.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        subjectMetrics.push({ 
            subject: name, 
            name,
            completion: subjectTotalChapters > 0 ? (subjectCompleted / subjectTotalChapters) * 100 : 0,
            total: subjectTotalChapters,
            completed: subjectCompleted,
            avgConfidence: subjectChaptersWithProgress > 0 ? subjectTotalConfidence / subjectChaptersWithProgress : 0,
            totalMcqs: subjectTotalMcqs,
        });
    }
    
    if (hasChemistry) {
        totalChapters += chemTotalChapters;
        completedChapters += chemCompletedChapters;
        totalConfidence += chemTotalConfidence;
        chaptersWithProgress += chemChaptersWithProgress;
        totalMcqs += chemTotalMcqs;

        subjectMetrics.push({
            subject: 'Chemistry',
            name: 'Chemistry',
            completion: chemTotalChapters > 0 ? (chemCompletedChapters / chemTotalChapters) * 100 : 0,
            total: chemTotalChapters,
            completed: chemCompletedChapters,
            avgConfidence: chemChaptersWithProgress > 0 ? chemTotalConfidence / chemChaptersWithProgress : 0,
            totalMcqs: chemTotalMcqs,
        });
    }

    const overallCompletionPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    const averageConfidence = chaptersWithProgress > 0 ? totalConfidence / chaptersWithProgress : 0;

    const pieData = [
      { name: 'Completed', value: completedChapters },
      { name: 'Pending', value: totalChapters - completedChapters },
    ];
    
    subjectMetrics.sort((a, b) => {
        const order = ['Physics', 'Chemistry', 'Biology', 'Mathematics'];
        return order.indexOf(a.name) - order.indexOf(b.name);
    });
    
    const confidenceBarData = subjectMetrics.map(s => ({ name: s.name, Confidence: s.avgConfidence }));
    const mcqsBarData = subjectMetrics.map(s => ({ name: s.name, MCQs: s.totalMcqs }));
    const completionBarData = subjectMetrics;

    return { 
        pieData, 
        completionBarData,
        confidenceBarData,
        mcqsBarData,
        totalChapters, 
        completedChapters,
        overallCompletionPercentage,
        averageConfidence,
        totalMcqs,
        totalRevisions
    };

  }, [profile, syllabuses, progress]);


  useEffect(() => {
    if (pdfContent && pdfRef.current) {
        html2canvas(pdfRef.current, { scale: 3, useCORS: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / pdfWidth;
            const finalHeight = imgHeight / ratio;
            let heightLeft = finalHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - finalHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
                heightLeft -= pdfHeight;
            }
            pdf.save(`Progress-Report-${profile?.displayName}.pdf`);
            setPdfContent(null);
            setIsDownloading(false);
        }).catch(e => {
            console.error("Error generating PDF:", e);
            setPdfContent(null);
            setIsDownloading(false);
        });
    }
}, [pdfContent, profile?.displayName]);

const handleDownload = () => {
    if (!profile || !progress || !syllabuses || !chartData) return;
    setIsDownloading(true);
    const syllabusToDownload = ALL_SUBJECTS[profile.exam!];
    setPdfContent({ profile, progress, allSyllabus: syllabusToDownload, chartData });
};


  if (profileLoading || syllabusLoading || !progressLoaded) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!chartData) {
    return <p>Could not load chart data.</p>
  }

  const { pieData, completionBarData, confidenceBarData, mcqsBarData, totalChapters, completedChapters, overallCompletionPercentage, averageConfidence, totalMcqs } = chartData;

  return (
    <div className="grid gap-6 auto-rows-min">
         {pdfContent && (
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={pdfRef}>
                    <ProgressPdfLayout {...pdfContent} />
                </div>
            </div>
        )}
        <div className="flex justify-end gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View Report
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Progress Report</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-full pr-6">
                       <ProgressPdfLayout 
                           profile={profile!} 
                           progress={progress} 
                           allSyllabus={ALL_SUBJECTS[profile!.exam!]} 
                           chartData={chartData} 
                       />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Report
            </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="Chapters Completed"
                value={`${completedChapters} / ${totalChapters}`}
                icon={CheckCircle2}
                description="Total chapters marked as 'Done'"
            />
             <StatCard 
                title="Overall Completion"
                value={`${overallCompletionPercentage.toFixed(1)}%`}
                icon={Target}
                description="Percentage of syllabus covered"
            />
             <StatCard 
                title="Average Confidence"
                value={`${averageConfidence.toFixed(1)}%`}
                icon={BrainCircuit}
                description="Your confidence across all topics"
            />
             <StatCard 
                title="Total MCQs Practiced"
                value={`${totalMcqs.toLocaleString()}`}
                icon={ListChecks}
                description="Total questions practiced"
            />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Overall Syllabus Completion</CardTitle>
                    <CardDescription>
                        You have completed {completedChapters} out of {totalChapters} chapters.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} chapters`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-3 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Subject-wise Completion</CardTitle>
                    <CardDescription>
                        Chapter completion percentage for each subject.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={completionBarData}>
                            <XAxis
                                dataKey="subject"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                            formatter={(value, name, props) => {
                                    const { completed, total } = props.payload;
                                    return [`${value.toFixed(1)}% (${completed}/${total})`, 'Completion'];
                            }}
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                            />
                            <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Average Confidence per Subject</CardTitle>
                    <CardDescription>
                        How confident you feel in each subject.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={confidenceBarData}>
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                                formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Avg. Confidence']}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                            />
                            <Bar dataKey="Confidence" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>MCQs Practiced per Subject</CardTitle>
                    <CardDescription>
                        Volume of questions you have practiced.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={mcqsBarData}>
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                formatter={(value) => [(value as number).toLocaleString(), 'MCQs Practiced']}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                            />
                            <Bar dataKey="MCQs" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    