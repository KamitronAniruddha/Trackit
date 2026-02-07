import * as React from 'react';

interface ContactEmailTemplateProps {
  name: string;
  email: string;
  message: string;
}

export const ContactEmailTemplate: React.FC<Readonly<ContactEmailTemplateProps>> = ({
  name,
  email,
  message,
}) => (
  <div>
    <h1>New Message from your Portfolio Contact Form</h1>
    <p>
      You have received a new message from <strong>{name}</strong> ({email}).
    </p>
    <hr />
    <h2>Message:</h2>
    <p>{message}</p>
    <hr />
    <p>This email was sent from your Exam Tracker application.</p>
  </div>
);
