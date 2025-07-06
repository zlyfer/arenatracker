import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  public: boolean;
  champs: string[];
  createdAt: string;
  lastUse: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = environment.apiBaseUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'arenaTrackerToken';

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem('arenaTrackerUser');
    const token = localStorage.getItem(this.tokenKey);

    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error parsing saved user', e);
        this.clearAuth();
      }
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    // Hash the password using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    try {
      const response = await this.http.post<LoginResponse>(`${this.API_BASE_URL}/login`, {
        username,
        password: hashHex
      }).pipe(
        map(response => {
          if (response.success && response.user && response.token) {
            localStorage.setItem('arenaTrackerUser', JSON.stringify(response.user));
            localStorage.setItem(this.tokenKey, response.token);
            this.currentUserSubject.next(response.user);
          }
          return response;
        })
      ).toPromise();

      return response || { success: false, message: 'Login failed', user: null };
    } catch (error) {
      return { success: false, message: 'Login failed', user: null };
    }
  }

  logout(): void {
    this.clearAuth();
  }

  private clearAuth(): void {
    localStorage.removeItem('arenaTrackerUser');
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null && this.getToken() !== null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  }
}