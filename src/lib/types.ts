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

export interface Mistake {
    id: string;
    userId: string;
    subject: string;
    chapter: string;
    question: string;
    myMistake: string;
    correctConcept: string;
    tags: string[];
    status: 'active' | 'reviewed';
    createdAt: Timestamp;
}
