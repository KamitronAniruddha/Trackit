
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumCodeActivator } from "./premium-code-activator";

interface PremiumFeatureLockProps {
    featureName: string;
    description: string;
}

export function PremiumFeatureLock({ featureName, description }: PremiumFeatureLockProps) {
    const router = useRouter();
    return (
        <Card className="w-full max-w-2xl mx-auto my-12 border-primary/20 shadow-2xl shadow-primary/10">
             <CardHeader className="text-center">
                 <div className="mx-auto p-4 bg-primary/10 rounded-full mb-6 w-fit">
                    <Lock className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl">Unlock {featureName}</CardTitle>
                <CardDescription className="max-w-md mx-auto">
                    {description} This is a premium feature. Please activate your account to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <Tabs defaultValue="admin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="admin">Activate with Admin</TabsTrigger>
                        <TabsTrigger value="code">Enter Activation Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="admin" className="pt-6 text-center">
                        <p className="text-muted-foreground mb-4">Show your 6-digit access code to an admin for manual activation.</p>
                        <Button 
                            onClick={() => router.push('/pending-approval')}
                        >
                            View My Access Code
                        </Button>
                    </TabsContent>
                    <TabsContent value="code" className="pt-6">
                        <PremiumCodeActivator />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
