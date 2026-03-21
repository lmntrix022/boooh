import { FallbackProps } from 'react-error-boundary'
import { Button } from './button'

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Une erreur est survenue</h2>
        <pre className="text-sm bg-gray-100 p-4 rounded mb-4 overflow-auto">
          {error.message}
        </pre>
        <Button onClick={resetErrorBoundary} variant="default">
          Réessayer
        </Button>
      </div>
    </div>
  )
} 