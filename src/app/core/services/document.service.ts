import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  LoanDocument,
  UploadDocumentResult,
  DownloadDocumentResult,
  DocumentType,
} from '../models/loan-document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly base = `${environment.apiUrl}/api/loans`;

  constructor(private http: HttpClient) {}

  getDocuments(loanId: string) {
    return this.http.get<LoanDocument[]>(`${this.base}/${loanId}/documents`);
  }

  uploadDocument(loanId: string, file: File, documentType?: DocumentType) {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType) {
      formData.append('documentType', documentType);
    }
    return this.http.post<UploadDocumentResult>(`${this.base}/${loanId}/documents`, formData);
  }

  getDownloadUrl(loanId: string, documentId: string) {
    return this.http.get<DownloadDocumentResult>(
      `${this.base}/${loanId}/documents/${documentId}/download`,
    );
  }
}
