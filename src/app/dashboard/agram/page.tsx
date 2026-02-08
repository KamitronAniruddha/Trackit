
'use client';
import { PostFeed } from "@/components/agram/post-feed";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import { CreatePostDialog } from "@/components/agram/create-post-dialog";
import { useUserProfile } from "@/contexts/user-profile-context";
import { PremiumFeatureLock } from "@/components/premium-lock";
import { FollowRequestsPopover } from "@/components/agram/follow-requests-popover";

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
                    <div className="flex items-center gap-2">
                        <FollowRequestsPopover />
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Post
                        </Button>
                    </div>
                </div>
                <PostFeed />
            </div>
            <CreatePostDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </>
    );
}
