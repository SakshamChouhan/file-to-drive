import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts Draft.js content to plain text
 */
export function convertFromDraftToPlainText(content: string): string {
  if (!content) return '';
  
  try {
    // Parse the content JSON
    const contentState = JSON.parse(content);
    
    // Extract text from blocks
    if (contentState.blocks && Array.isArray(contentState.blocks)) {
      return contentState.blocks
        .map((block: any) => block.text)
        .filter(Boolean)
        .join('\n\n');
    }
    
    return content;
  } catch (error) {
    console.error('Error converting Draft.js content to plain text:', error);
    return content;
  }
}