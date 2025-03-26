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
  
  const handleSaveToDrive = async () => {
    setIsSaveToDriveModalOpen(true);
  };
  
  const handleConfirmSaveToDrive = async (documentTitle: string, folder: string, permission: string) => {
    // First update the title if changed
    if (documentTitle !== title) {
      handleTitleChange(documentTitle);
    }
    
    // Save to drive
    const success = await saveToGoogleDrive();
    
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
