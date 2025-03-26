import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

type MessageHandler = (data: any) => void;

interface WebSocketHookOptions {
  documentId: string;
  onUserJoined?: MessageHandler;
  onUserLeft?: MessageHandler;
  onDocumentUpdated?: MessageHandler;
  onCursorPosition?: MessageHandler;
}

export function useWebSocket({
  documentId,
  onUserJoined,
  onUserLeft,
  onDocumentUpdated,
  onCursorPosition
}: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!documentId || !user) return;
    
    // Determine WebSocket protocol based on current page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    // Connection opened
    socket.addEventListener('open', () => {
      setIsConnected(true);
      setIsError(false);
      
      // Join the document editing session
      sendMessage({
        type: 'join',
        userId: user.id,
        documentId
      });
    });
    
    // Connection closed
    socket.addEventListener('close', () => {
      setIsConnected(false);
    });
    
    // Connection error
    socket.addEventListener('error', () => {
      setIsError(true);
      setIsConnected(false);
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        switch (data.type) {
          case 'user-joined':
            onUserJoined && onUserJoined(data);
            break;
            
          case 'user-left':
            onUserLeft && onUserLeft(data);
            break;
            
          case 'document-updated':
            onDocumentUpdated && onDocumentUpdated(data);
            break;
            
          case 'cursor-position':
            onCursorPosition && onCursorPosition(data);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Cleanup on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Leave the document editing session
        sendMessage({
          type: 'leave',
          userId: user.id,
          documentId
        });
        
        socket.close();
      }
    };
  }, [documentId, user]);
  
  // Send message to WebSocket server
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  // Send document updates
  const sendDocumentUpdate = useCallback((content: string, selection?: any) => {
    if (!user) return false;
    
    return sendMessage({
      type: 'update',
      userId: user.id,
      documentId,
      content,
      selection
    });
  }, [documentId, sendMessage, user]);
  
  // Send cursor position
  const sendCursorPosition = useCallback((position: any) => {
    if (!user) return false;
    
    return sendMessage({
      type: 'cursor-move',
      userId: user.id,
      documentId,
      position
    });
  }, [documentId, sendMessage, user]);
  
  return {
    isConnected,
    isError,
    sendDocumentUpdate,
    sendCursorPosition
  };
}