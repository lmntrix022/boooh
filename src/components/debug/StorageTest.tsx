import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { testImageUpload, getBucketStats, initializeSupabaseStorage } from '@/utils/supabaseStorage';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const StorageTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    bucketCheck: boolean | null;
    uploadTest: boolean | null;
    bucketStats: any;
  }>({
    bucketCheck: null,
    uploadTest: null,
    bucketStats: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testImage, setTestImage] = useState('');

  const runTests = async () => {
    setIsLoading(true);
    setTestResults({
      bucketCheck: null,
      uploadTest: null,
      bucketStats: null
    });

    try {
      // Test 1: Vérifier les buckets
      // Log removed
      await initializeSupabaseStorage();
      setTestResults(prev => ({ ...prev, bucketCheck: true }));

      // Test 2: Test d'upload
      // Log removed
      const uploadSuccess = await testImageUpload();
      setTestResults(prev => ({ ...prev, uploadTest: uploadSuccess }));

      // Test 3: Statistiques des buckets
      // Log removed
      const avatarsStats = await getBucketStats('avatars');
      const coversStats = await getBucketStats('card-covers');
      setTestResults(prev => ({ 
        ...prev, 
        bucketStats: { avatars: avatarsStats, covers: coversStats }
      }));

    } catch (error) {
      // Error log removed
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    if (status) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Non testé';
    if (status) return 'Succès';
    return 'Échec';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧪 Test du Storage Supabase</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Tests en cours...
              </>
            ) : (
              'Lancer les tests'
            )}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              {getStatusIcon(testResults.bucketCheck)}
              <span className="font-medium">Vérification des buckets</span>
              <span className="ml-auto text-sm text-gray-600">
                {getStatusText(testResults.bucketCheck)}
              </span>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              {getStatusIcon(testResults.uploadTest)}
              <span className="font-medium">Test d'upload</span>
              <span className="ml-auto text-sm text-gray-600">
                {getStatusText(testResults.uploadTest)}
              </span>
            </div>
          </div>

          {testResults.bucketStats && (
            <div className="space-y-4">
              <h3 className="font-semibold">📊 Statistiques des buckets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Bucket: avatars</h4>
                  <p className="text-sm text-blue-700">
                    Fichiers: {testResults.bucketStats.avatars?.fileCount || 0}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Bucket: card-covers</h4>
                  <p className="text-sm text-green-700">
                    Fichiers: {testResults.bucketStats.covers?.fileCount || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🖼️ Test d'Upload d'Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            label="Test d'upload"
            value={testImage}
            onChange={setTestImage}
            type="avatar"
            maxSizeMB={5}
          />
          
          {testImage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Image uploadée avec succès !
              </p>
              <p className="text-xs text-green-600 mt-1">
                URL: {testImage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. <strong>Créer les buckets</strong> dans Supabase Dashboard `&gt;` Storage</p>
          <p>2. <strong>Configurer les politiques RLS</strong> (voir SUPABASE_STORAGE_SETUP.md)</p>
          <p>3. <strong>Lancer les tests</strong> pour vérifier la configuration</p>
          <p>4. <strong>Test d'upload</strong> pour valider le fonctionnement</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageTest;
