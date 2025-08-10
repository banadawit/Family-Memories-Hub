// src/components/MessageModal.jsx
import React from 'react';

export default function MessageModal({ message, type, onClose }) {
  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 font-inter">
      <div className={`p-6 rounded-lg shadow-lg max-w-sm w-full space-y-4 border-t-4 ${bgColor} ${borderColor}`}>
        <h3 className={`text-xl font-semibold ${textColor}`}>
          {type === 'success' ? 'Success!' : 'Error!'}
        </h3>
        <p className={`text-gray-700 ${textColor}`}>
          {message}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}