'use client';

import type { Post } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useUserProfile } from "@/contexts/user-profile-context";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Button } from "../ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { FollowButton } from "../follow-button";

export function PostCard({ post }: { post: Post }) {
    const { profile } = useUserProfile();
    const firestore = useFirestore();
    const [isLiked, setIsLiked] = useState(profile ? post.likes.includes(profile.uid) : false);
    const [likeCount, setLikeCount] = useState(post.likes.length);

    const handleLike = async () => {
        if (!profile) return;
        
        const postRef = doc(firestore, 'posts', post.id);
        const alreadyLiked = isLiked;

        setIsLiked(!alreadyLiked);
        setLikeCount(prev => alreadyLiked ? prev - 1 : prev + 1);

        try {
            await updateDoc(postRef, {
                likes: alreadyLiked ? arrayRemove(profile.uid) : arrayUnion(profile.uid)
            });
        } catch (error) {
            // Revert optimistic update on error
            setIsLiked(alreadyLiked);
            setLikeCount(post.likes.length);
            console.error("Error liking post:", error);
        }
    };
    
    return (
        <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.userPhotoURL ?? undefined} />
                        <AvatarFallback>{post.userDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.userDisplayName}</p>
                        {post.createdAt && (
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                </div>
                <FollowButton targetUserId={post.userId} />
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative aspect-square w-full">
                    <Image 
                        src={post.imageUrl}
                        alt={`Post by ${post.userDisplayName}`}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="p-4 space-y-2">
                    <p>
                        <span className="font-semibold mr-2">{post.userDisplayName}</span>
                        {post.caption}
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex items-center gap-4 border-t pt-4">
                 <Button variant="ghost" size="sm" onClick={handleLike}>
                    <Heart className={cn("mr-2 h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
                    <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                </Button>
                <Button variant="ghost" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Comment
                </Button>
            </CardFooter>
        </Card>
    );
}
