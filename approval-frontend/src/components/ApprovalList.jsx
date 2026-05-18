import { useState, useEffect } from 'react';
import ApprovalCard from './ApprovalCard';

export default function ApprovalList({ approvalToAdd }) {
  const [approvals, setApprovals] = useState([]);

  // When a new approval is created, add it to the list
  useEffect(() => {
    if (approvalToAdd) {
      setApprovals([approvalToAdd, ...approvals]);
    }
  }, [approvalToAdd]);

  // Handle status change in a card
  const handleStatusChange = (updatedApproval) => {
    setApprovals(
      approvals.map((approval) =>
        approval.id === updatedApproval.id ? updatedApproval : approval
      )
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Approval Requests</h2>
      
      {approvals.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No approval requests yet. Create one above to get started!
        </p>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
