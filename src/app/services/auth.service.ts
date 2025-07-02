import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  user: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'http://localhost:8080/lolarena';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const savedUser = localStorage.getItem('lolArenaUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error parsing saved user', e);
        localStorage.removeItem('lolArenaUser');
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
          if (response.success && response.user) {
            localStorage.setItem('lolArenaUser', JSON.stringify(response.user));
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
    localStorage.removeItem('lolArenaUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
}