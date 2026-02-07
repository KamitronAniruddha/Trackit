
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Copy, Trash2 } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface PremiumCode {
    id: string;
    code: string;
    createdAt: { toDate: () => Date } | null;
    createdBy: string;
}

export function PremiumCodeGenerator() {
  const [codes, setCodes] = useState<PremiumCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  useEffect(() => {
    const codesRef = collection(firestore, 'premiumCodes');
    const q = query(codesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const codeList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PremiumCode));
        setCodes(codeList);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching premium codes: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch premium codes.' });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, toast]);

  const handleGenerateCode = async () => {
    if (!profile) return;
    setIsGenerating(true);

    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
      const codeRef = doc(firestore, 'premiumCodes', newCode);
      await setDoc(codeRef, {
        code: newCode,
        createdAt: serverTimestamp(),
        createdBy: profile.uid,
      });

      toast({
        title: 'Code Generated!',
        description: `New code ${newCode} is ready to be shared.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error generating code',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied to clipboard!', description: code });
  }

  const handleDeleteCode = async (codeId: string) => {
    try {
        await deleteDoc(doc(firestore, 'premiumCodes', codeId));
        toast({ title: 'Code Deleted' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete code.'});
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">One-Time Activation Codes</CardTitle>
        <CardDescription>
          Generate one-time codes that any demo user can enter to gain premium access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateCode} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Generate New Code
        </Button>

        <div className="space-y-2 pt-4">
            <h4 className="font-medium text-sm text-muted-foreground">Available Codes</h4>
            <ScrollArea className="h-48 w-full rounded-md border p-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : codes.length > 0 ? (
                    <div className="space-y-2">
                    {codes.map((code) => (
                        <div key={code.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div>
                                <p className="font-mono text-lg">{code.code}</p>
                                <p className="text-xs text-muted-foreground">
                                    Created {code.createdAt ? formatDistanceToNow(code.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(code.code)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteCode(code.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No codes generated yet.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
