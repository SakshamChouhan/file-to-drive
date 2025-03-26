interface LoadingIndicatorProps {
  message?: string;
  isLoading: boolean;
}

export function LoadingIndicator({ message = "Loading...", isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 dark:bg-neutral-900 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 font-medium">{message}</p>
      </div>
    </div>
  );
}
