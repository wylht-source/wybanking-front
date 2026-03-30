export type DocumentType = 'PaySlip' | 'IncomeProof' | 'Identity' | 'BankStatement' | 'Other';

export interface LoanDocument {
  documentId: string;
  loanId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  documentType: DocumentType;
  storageProvider: string;
  uploadedAt: string;
  uploadedByUserId?: string;
}

export interface UploadDocumentResult {
  documentId: string;
  loanId: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  documentType: DocumentType;
  storageProvider: string;
  uploadedAt: string;
}

export interface DownloadDocumentResult {
  documentId: string;
  originalFileName: string;
  downloadUri: string;
  expiresAt: string;
}
