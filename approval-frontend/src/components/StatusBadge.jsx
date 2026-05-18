export default function StatusBadge({ status }) {
  const statusStyles = {
    PENDING: 'bg-pending text-gray-900 font-semibold',
    APPROVED: 'bg-approved text-white font-semibold',
    REJECTED: 'bg-rejected text-white font-semibold',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusStyles[status] || 'bg-gray-200'}`}>
      {status}
    </span>
  );
}
