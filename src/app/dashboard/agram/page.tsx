
'use client';
import { PostFeed } from "@/components/agram/post-feed";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreatePostDialog } from "@/components/agram/create-post-dialog";
import { useUserProfile } from "@/contexts/user-profile-context";
import { PremiumFeatureLock } from "@/components/premium-lock";

export default function AgramPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { profile } = useUserProfile();

    if (!profile?.isPremium) {
        return <PremiumFeatureLock featureName="A-gram" description="Share your study journey, find motivation, and connect with fellow aspirants in our exclusive community feed." />;
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">A-gram</h1>
                        <p className="text-muted-foreground">
                            Share your moments and connect with the community.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Post
                    </Button>
                </div>
                <PostFeed />
            </div>
            <CreatePostDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </>
    );
}
