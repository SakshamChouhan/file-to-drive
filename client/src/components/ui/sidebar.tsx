import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  const sidebarClass = isMobileOpen
    ? "fixed inset-y-0 left-0 z-40 w-64 block transition-all duration-300 ease-in-out md:relative"
    : "w-64 hidden md:block transition-all duration-300 ease-in-out";
  
  return (
    <>
      <button 
        id="sidebarToggle" 
        onClick={toggleMobileSidebar}
        className="fixed z-50 top-4 left-4 md:hidden rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 shadow-md"
      >
        <span className="material-icons">menu</span>
      </button>
      
      <aside className={`${sidebarClass} bg-white dark:bg-neutral-900 shadow-md h-full`}>
        <div className="p-4 flex items-center border-b border-neutral-200 dark:border-neutral-700">
          <span className="material-icons text-primary mr-3">description</span>
          <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">LetterDrive</h1>
        </div>
        
        <nav className="p-4">
          {/* User info */}
          {user && (
            <div className="mb-6 flex items-center p-2 rounded-full">
              <Avatar className="mr-3 h-8 w-8">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.name}</p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">{user.email}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <Link href="/editor">
              <a className="w-full flex items-center p-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700">
                <span className="material-icons mr-4">add</span>
                <span>New Letter</span>
              </a>
            </Link>
            
            <Link href="/dashboard">
              <a className={`w-full flex items-center p-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                location === '/dashboard' ? 'bg-neutral-100 dark:bg-neutral-800 font-medium' : ''
              }`}>
                <span className="material-icons mr-4">edit</span>
                <span>My Drafts</span>
              </a>
            </Link>
            
            <button className="w-full flex items-center p-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <span className="material-icons mr-4">cloud_done</span>
              <span>Drive Letters</span>
            </button>
          </div>
          
          <hr className="my-4 border-neutral-200 dark:border-neutral-700" />
          
          <div className="space-y-1">
            <button className="w-full flex items-center p-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <span className="material-icons mr-4">settings</span>
              <span>Settings</span>
            </button>
            
            <button 
              onClick={signOut}
              className="w-full flex items-center p-3 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <span className="material-icons mr-4">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
