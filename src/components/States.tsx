import { Loader2, AlertTriangle } from 'lucide-react';

export function Loading({ label = 'Loading dataset...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-navy-400">
      <Loader2 size={32} className="animate-spin text-teal-500" />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={26} className="text-red-500" />
      </div>
      <p className="text-navy-700 font-semibold mb-1">Couldn't load the dataset</p>
      <p className="text-sm text-navy-400 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-navy-400 text-sm">{message}</p>
    </div>
  );
}
