
'use client';
import { GroupList } from "@/components/group-list";
import { PremiumFeatureLock } from "@/components/premium-lock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/contexts/user-profile-context";
import { DirectMessageList } from "@/components/direct-message-list";

export default function MessagesPage() {
    const { profile } = useUserProfile();

    if (!profile?.isPremium) {
        return <PremiumFeatureLock featureName="Messaging" description="Collaborate with your peers in groups and chat directly with other users." />;
    }
    
    return (
        <div className="flex flex-col gap-6">
             <p className="text-muted-foreground -mt-4">Your conversations.</p>
            <Tabs defaultValue="groups" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="groups">Groups</TabsTrigger>
                    <TabsTrigger value="directs">Directs</TabsTrigger>
                </TabsList>
                <TabsContent value="groups" className="mt-4">
                    <GroupList />
                </TabsContent>
                <TabsContent value="directs" className="mt-4">
                    <DirectMessageList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
