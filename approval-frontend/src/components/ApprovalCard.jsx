import { useState } from 'react';
import { approvalService } from '../services/approvalService';
import StatusBadge from './StatusBadge';

export default function ApprovalCard({ approval, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError('');
      const updatedApproval = await approvalService.approveApproval(approval.id);
      if (onStatusChange) {
        onStatusChange(updatedApproval);
      }
    } catch (err) {
      setError(err.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      setError('');
      const updatedApproval = await approvalService.rejectApproval(approval.id);
      if (onStatusChange) {
        onStatusChange(updatedApproval);
      }
    } catch (err) {
      setError(err.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const isPending = approval.status === 'PENDING';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>
          <p className="text-sm text-gray-500 mt-1">ID: {approval.id}</p>
        </div>
        <StatusBadge status={approval.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <p className="font-medium text-gray-900">Version</p>
          <p>{approval.version}</p>
        </div>
        <div>
          <p className="font-medium text-gray-900">Created</p>
          <p>{new Date(approval.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isPending && (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Processing...' : '✓ Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Processing...' : '✗ Reject'}
          </button>
        </div>
      )}

      {!isPending && (
        <p className="text-center text-gray-500 text-sm py-2">
          {approval.status === 'APPROVED' ? '✓ This request has been approved' : '✗ This request has been rejected'}
        </p>
      )}
    </div>
  );
}
