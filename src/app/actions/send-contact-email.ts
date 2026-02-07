
'use server';

import { z } from 'zod';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  message: z.string().min(1, 'Message is required.'),
});

export async function sendContactEmail(formData: unknown) {
  const parsedData = contactFormSchema.safeParse(formData);

  if (!parsedData.success) {
    return { success: false, error: 'Invalid form data.' };
  }

  const { name, email, message } = parsedData.data;

  try {
    // Save submission to Firestore
    await addDoc(collection(firestore, "contactSubmissions"), {
      name,
      email,
      message,
      createdAt: serverTimestamp(),
      isRead: false,
    });

    console.log('--- New Contact Form Submission ---');
    console.log('Saved to Firestore collection: contactSubmissions');
    console.log('From Name:', name);
    console.log('From Email:', email);
    console.log('Message:', message);
    console.log('------------------------------------');

    return { success: true, message: 'Your message has been sent successfully!' };
  } catch (error) {
    console.error('Error saving contact form submission:', error);
    return { success: false, error: 'An unexpected error occurred while saving your message.' };
  }
}
