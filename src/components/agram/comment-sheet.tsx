'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase/provider';
import { useUserProfile } from '@/contexts/user-profile-context';
import type { Comment } from '@/lib/types';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, writeBatch, increment } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface CommentSheetProps {
  postId: string;
  postAuthorId: string;
  postAuthorName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CommentSheet({ postId, postAuthorId, postAuthorName, isOpen, onOpenChange }: CommentSheetProps) {
  const firestore = useFirestore();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const commentsRef = collection(firestore, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(commentList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, postId, isOpen]);
  
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);


  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;
    
    setIsSubmitting(true);
    try {
      const postRef = doc(firestore, 'posts', postId);
      const commentsRef = collection(postRef, 'comments');
      const newCommentRef = doc(commentsRef);

      const batch = writeBatch(firestore);

      // Add new comment
      batch.set(newCommentRef, {
        userId: profile.uid,
        userDisplayName: profile.displayName,
        userPhotoURL: profile.photoURL,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      // Increment comment count on post
      batch.update(postRef, { commentCount: increment(1) });

      await batch.commit();
      
      setNewComment('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not post comment.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      const postRef = doc(firestore, 'posts', postId);
      const commentRef = doc(firestore, 'posts', postId, 'comments', commentId);
      
      const batch = writeBatch(firestore);
      batch.delete(commentRef);
      batch.update(postRef, { commentCount: increment(-1) });
      
      await batch.commit();

      toast({ title: 'Comment deleted.' });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not delete comment.' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Comments</SheetTitle>
          <SheetDescription>Comments on {postAuthorName}'s post.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 my-4 pr-4 -mr-6">
            {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            {!loading && comments.length === 0 && (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                <p>No comments yet. Be the first!</p>
                </div>
            )}
            {!loading && (
                <div className="space-y-6">
                {comments.map(comment => {
                    const canDelete = profile && (profile.uid === comment.userId || profile.uid === postAuthorId);
                    return (
                        <div key={comment.id} className="flex items-start gap-3 group">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={comment.userPhotoURL ?? undefined} />
                            <AvatarFallback>{comment.userDisplayName?.charAt(0) ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p>
                            <span className="font-semibold mr-2">{comment.userDisplayName}</span>
                            {comment.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </p>
                        </div>
                        {canDelete && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive">
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete this comment.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        </div>
                    );
                })}
                 <div ref={endOfMessagesRef} />
                </div>
            )}
            </ScrollArea>
            <div className="mt-auto border-t pt-4">
            <form onSubmit={handlePostComment} className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.photoURL ?? undefined} />
                    <AvatarFallback>{profile?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={!profile || isSubmitting}
                />
                <Button type="submit" size="icon" disabled={!newComment.trim() || isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </form>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
