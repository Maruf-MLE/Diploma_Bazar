// src/pages/verification/deleted_details/[id].tsx
import React from 'react';
import { useParams } from 'react-router-dom';

const VerificationDeletedDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>Verification Deleted Details</h1>
      <p>ID: {id}</p>
      <p>This page displays the details of a deleted verification.</p>
    </div>
  );
};

export default VerificationDeletedDetailsPage;