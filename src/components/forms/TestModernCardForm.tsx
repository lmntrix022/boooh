import React from 'react';

export const TestModernCardForm: React.FC = () => {
  // Log removed
  
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">TEST ModernCardForm</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            ✅ ModernCardForm se rend correctement !
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              <strong>Composant :</strong> TestModernCardForm
            </p>
            <p className="text-gray-700">
              <strong>Status :</strong> Fonctionnel
            </p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => {
                // Log removed
                alert("ModernCardForm fonctionne !");
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Test ModernCardForm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
