import { useAuth } from "@/hooks/use-auth";

export function LoginOverlay() {
  const { signInWithGoogle } = useAuth();
  
  return (
    <div className="absolute inset-0 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <span className="material-icons text-primary text-5xl">description</span>
        </div>
        <h1 className="text-2xl font-medium mb-3 text-neutral-900 dark:text-neutral-100">Welcome to LetterDrive</h1>
        <p className="text-neutral-700 dark:text-neutral-300 mb-8">Create, edit and save letters directly to your Google Drive</p>
        
        <button 
          onClick={signInWithGoogle}
          className="flex items-center justify-center w-full px-4 py-3 mb-4 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm hover:shadow"
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="w-5 h-5 mr-3" />
          <span className="text-neutral-800 dark:text-neutral-200 font-medium">Sign in with Google</span>
        </button>
        
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
          By signing in, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
