import React, { useState } from 'react';
import { X } from 'lucide-react';

const RenameDialog = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(name);
    setName('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Rename Verification</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter verification name"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
              disabled={!name.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameDialog;