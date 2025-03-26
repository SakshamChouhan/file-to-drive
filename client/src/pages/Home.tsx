import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useEditor } from '@/hooks/useEditor';
import { Document } from '@shared/schema';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import UserProfile from '@/components/UserProfile';
import SaveToDriveModal from '@/components/SaveToDriveModal';
import Toast from '@/components/Toast';
import { createNewDocument } from '@/lib/api';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { documents, getDocument } = useDocuments();
  const [activeDocId, setActiveDocId] = useState<number | undefined>(undefined);
  const [isSaveToDriveModalOpen, setIsSaveToDriveModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; details?: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth >= 768);
  
  // Get the active document
  const { data: activeDocument, isLoading: documentLoading } = getDocument(activeDocId || 0);
  
  // Use editor hook to handle document editing
  const {
    document: editingDocument,
    content,
    title,
    isSaving,
    isSaved,
    lastSavedTime,
    handleContentChange,
    handleTitleChange,
    saveDraft,
    saveToGoogleDrive
  } = useEditor(activeDocument);
  
  // Set active document to first one on load if not already set
  useEffect(() => {
    if (!authLoading && isAuthenticated && documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [authLoading, isAuthenticated, documents, activeDocId]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);
  
  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarVisible(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleCreateNewDocument = async () => {
    try {
      const newDocument = await createNewDocument();
      setActiveDocId(newDocument.id);
      setToast({
        message: 'New letter created',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to create new document:', error);
      setToast({
        message: 'Failed to create new document',
        type: 'error'
      });
    }
  };
  
  const handleSelectDocument = (document: Document) => {
    setActiveDocId(document.id);
  };
  
  const handleSaveToDrive = async (): Promise<boolean> => {
    setIsSaveToDriveModalOpen(true);
    return true; // Indicates the modal opened successfully
  };
  
  const handleConfirmSaveToDrive = async (documentTitle: string, category: string, permission: string): Promise<void> => {
    // Always update the title with the value from the modal
    handleTitleChange(documentTitle);
    // Always save the draft with the updated title before saving to Drive
    await saveDraft();
    
    try {
      // Save to drive with the selected category, title, and permission
      const success = await saveToGoogleDrive(category, permission);
      
      if (success) {
        setToast({
          message: 'Document successfully saved to Google Drive',
          details: 'You can access it anytime from your Drive',
          type: 'success'
        });
      } else {
        setToast({
          message: 'Failed to save document to Google Drive',
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error in handleConfirmSaveToDrive:', error);
      
      // Display specific error messages based on the error
      if (error.message?.includes('authentication') || error.message?.includes('sign in')) {
        setToast({
          message: 'Google authentication error',
          details: 'Please sign in again to reconnect to Google Drive',
          type: 'error'
        });
      } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        setToast({
          message: 'Google Drive API quota exceeded',
          details: 'Please try again later',
          type: 'error'
        });
      } else {
        setToast({
          message: 'Failed to save document to Google Drive',
          details: error.message || 'Unknown error occurred',
          type: 'error'
        });
      }
    }
  };
  
  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };
  
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="bg-[#F8F9FA] min-h-screen flex flex-col">
      {/* Header/Navigation Bar */}
      <header className="bg-white border-b border-[#E8EAED] sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo & App Name */}
            <div className="flex items-center space-x-2">
              <span className="material-icons text-[#4285F4] text-3xl">description</span>
              <h1 className="text-xl font-semibold text-[#202124] hidden sm:block">LetterDrive</h1>
            </div>
            
            {/* Save Status & Actions */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 hidden sm:inline">
                {isSaving ? 'Saving...' : isSaved ? 'All changes saved' : 'Unsaved changes'}
              </span>
              
              {/* Admin Link (only shown for admin users) */}
              {user?.isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setLocation('/admin');
                    return false;
                  }}
                  className="text-blue-600 hidden sm:inline-flex"
                >
                  Admin Panel
                </Button>
              )}
              
              {/* User Profile */}
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex">
        {/* Left Sidebar / Document List */}
        <Sidebar
          currentDocId={activeDocId}
          onNewDocument={handleCreateNewDocument}
          onSelectDocument={handleSelectDocument}
          className="hidden md:block"
          isVisible={true}
        />
        
        {/* Mobile Sidebar */}
        {isSidebarVisible && (
          <div className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 overflow-hidden">
            <div className="relative w-72 h-full bg-white transform transition-transform duration-300 ease-in-out">
              <Sidebar
                currentDocId={activeDocId}
                onNewDocument={handleCreateNewDocument}
                onSelectDocument={(doc) => {
                  handleSelectDocument(doc);
                  setIsSidebarVisible(false);
                }}
                isVisible={true}
              />
            </div>
          </div>
        )}
        
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden fixed bottom-4 left-4 z-10">
          <Button
            onClick={toggleSidebar}
            className="bg-[#4285F4] text-white rounded-full p-3 shadow-lg"
            aria-label="Toggle document list"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Mobile Admin Panel Button (only for admins) */}
        {user?.isAdmin && (
          <div className="md:hidden fixed bottom-4 right-4 z-10">
            <Button
              onClick={() => {
                setLocation('/admin');
                return false;
              }}
              className="bg-[#34A853] text-white rounded-full p-3 shadow-lg"
              aria-label="Admin Panel"
            >
              <span className="material-icons h-5 w-5">admin_panel_settings</span>
            </Button>
          </div>
        )}

        {/* Editor Container */}
        <Editor
          document={editingDocument}
          onSaveDraft={saveDraft}
          onSaveToDrive={handleSaveToDrive}
          onUpdateTitle={handleTitleChange}
          onUpdateContent={handleContentChange}
          isSaving={isSaving}
          isSaved={isSaved}
          lastSavedTime={lastSavedTime}
        />
      </main>
      
      {/* Save to Drive Modal */}
      <SaveToDriveModal
        isOpen={isSaveToDriveModalOpen}
        document={editingDocument}
        onClose={() => setIsSaveToDriveModalOpen(false)}
        onSave={handleConfirmSaveToDrive}
      />
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          details={toast.details}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Home;
