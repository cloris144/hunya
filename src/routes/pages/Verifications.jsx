import React from 'react';
import VerificationList from '../components/VerificationList';
import { FileCheck } from 'lucide-react';

const Verifications = () => {
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-100">Verifications</h1>
        </div>
        <p className="text-gray-400">
          View and manage your verification tasks
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-gray-900 rounded-lg shadow-lg">
        <VerificationList />
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        Last synchronized: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default Verifications;