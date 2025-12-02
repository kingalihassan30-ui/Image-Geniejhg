
export interface ImageAsset {
  id: string;
  url: string; // Base64 data URL
  mimeType: string;
  source: 'upload' | 'generated';
  prompt?: string;
  timestamp: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  demoImageUrl: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  READY = 'READY',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR'
}

export interface GenerationError {
  message: string;
  details?: string;
}
