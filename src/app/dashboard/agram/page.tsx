
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AgramPage() {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md text-center">
                 <CardHeader>
                    <div className="mx-auto p-4 bg-primary/10 rounded-full mb-4 w-fit">
                        <Construction className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Coming Soon!</CardTitle>
                    <CardDescription>
                        A-gram is under construction. This dedicated social space for aspirants will be launching in a future update.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
