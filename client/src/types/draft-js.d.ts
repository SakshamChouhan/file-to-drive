declare module 'draft-js' {
  import { Component } from 'react';

  export class Editor extends Component<any, any> {}
  export const EditorState: any;
  export const RichUtils: any;
  export const ContentState: any;
  export const convertToRaw: any;
  export const convertFromRaw: any;
  export const SelectionState: any;
  
  // Add other exports as needed
}