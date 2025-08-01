import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SupportRequest {
  category: 'question' | 'feature_request' | 'bug_report';
  description: string;
  captcha: string;
}

export interface SupportResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  submitSupportRequest(request: SupportRequest): Observable<SupportResponse> {
    return this.http.post<SupportResponse>(`${this.apiUrl}/support-request`, request, {
      headers: this.authService.getAuthHeaders()
    });
  }
}