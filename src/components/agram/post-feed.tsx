'use client';
import { useFirestore } from "@/firebase/provider";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { Loader2, CameraOff } from "lucide-react";
import type { Post } from "@/lib/types";

export function PostFeed() {
    const firestore = useFirestore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const postsRef = collection(firestore, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Post));
            setPosts(postList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground bg-card/50 rounded-lg border border-dashed">
                <CameraOff className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold">No Posts Yet</h3>
                <p className="text-sm mt-2">Be the first to share something on A-gram!</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto w-full space-y-8">
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
