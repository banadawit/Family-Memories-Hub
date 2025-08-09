// src/components/DeleteConfirmationModal.jsx
import React from 'react';

export default function DeleteConfirmationModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 font-inter">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full space-y-4">
        <h3 className="text-xl font-semibold text-pink-700">Confirm Deletion</h3>
        <p className="text-gray-700">
          Are you sure you want to delete this memory? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}