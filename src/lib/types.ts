import type { Timestamp } from "firebase/firestore";

export type Subject =
  | 'physics'
  | 'physical-chemistry'
  | 'organic-chemistry'
  | 'inorganic-chemistry'
  | 'biology'
  | 'chemistry'
  | 'mathematics';

export interface Post {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL: string | null;
    imageUrl: string;
    caption: string;
    likes: string[];
    commentCount?: number;
    createdAt: Timestamp;
}

export interface Comment {
    id: string;
    userId: string;
    userDisplayName: string;
    userPhotoURL: string | null;
    text: string;
    createdAt: Timestamp;
}

export interface Conversation {
    id: string;
    memberIds: string[];
    membersInfo: {
        [uid: string]: {
            displayName: string;
            photoURL?: string;
        }
    }
    lastMessage?: string;
    lastMessageAt?: Timestamp;
    lastMessageSenderId?: string;
    lastMessageSenderName?: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    photoURL?: string;
    adminId: string;
    memberIds: string[];
    lastMessage?: string;
    lastMessageAt?: Timestamp;
    lastMessageSenderId?: string;
    lastMessageSenderName?: string;
}
