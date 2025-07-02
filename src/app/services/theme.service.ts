import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'auto' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEMES: Theme[] = ['auto', 'light', 'dark'];
  private currentThemeIndex = 0;
  private themeSubject = new BehaviorSubject<Theme>('auto');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const savedTheme = localStorage.getItem('theme') as Theme || 'auto';
    this.currentThemeIndex = this.THEMES.indexOf(savedTheme);
    if (this.currentThemeIndex === -1) this.currentThemeIndex = 0;
    this.applyTheme(this.THEMES[this.currentThemeIndex]);
  }

  getCurrentTheme(): Theme {
    return this.THEMES[this.currentThemeIndex];
  }

  getNextTheme(): Theme {
    const nextIndex = (this.currentThemeIndex + 1) % this.THEMES.length;
    return this.THEMES[nextIndex];
  }

  cycleTheme(): void {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % this.THEMES.length;
    const newTheme = this.THEMES[this.currentThemeIndex];
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
    this.themeSubject.next(newTheme);
  }

  private applyTheme(theme: Theme): void {
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme') === 'auto') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}