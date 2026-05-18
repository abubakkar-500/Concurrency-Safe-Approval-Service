import { useState } from 'react';
import ApprovalForm from './components/ApprovalForm';
import ApprovalList from './components/ApprovalList';
import './index.css';

export default function App() {
  const [newApproval, setNewApproval] = useState(null);

  const handleApprovalCreated = (approval) => {
    setNewApproval(approval);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold">Approval System</h1>
          <p className="text-blue-100 mt-2">Manage approval requests with ease</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Form */}
          <div className="lg:col-span-1">
            <ApprovalForm onApprovalCreated={handleApprovalCreated} />
          </div>

          {/* Right side - List */}
          <div className="lg:col-span-2">
            <ApprovalList approvalToAdd={newApproval} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>Approval System © 2026 | Concurrency-Safe Approval Service</p>
        </div>
      </footer>
    </div>
  );
}
