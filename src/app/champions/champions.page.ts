import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../services/auth.service';
import { ChampionService } from '../services/champion.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-champions',
  templateUrl: './champions.page.html',
  styleUrls: ['./champions.page.scss'],
  standalone: false,
})
export class ChampionsPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  champions: string[] = [];
  filteredChampions: string[] = [];
  searchTerm = '';
  currentFilter: 'all' | 'owned' | 'unowned' = 'all';
  currentTheme = 'auto';
  isPublicStateSwitching = false;
  loadingChampions = new Set<string>();
  isLoadingChampions = true;
  championListConfig = {
    clickable: true,
    showCheckmarks: true,
    showLoadingStates: true,
    gridColumns: 6,
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private championService: ChampionService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get fresh user data with retry logic
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      this.currentUser = await this.authService.getCurrentUserFresh();
      if (this.currentUser) {
        break;
      }
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!this.currentUser) {
      console.error('Failed to load user data after retries');
      this.router.navigate(['/login']);
      return;
    }

    this.loadChampions();
    this.loadTheme();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadChampions() {
    this.isLoadingChampions = true;
    this.subscriptions.push(
      this.championService.getChampions().subscribe({
        next: (response) => {
          if (response.success) {
            this.champions = response.champions;
            this.applyFilters();
          } else {
            console.error('Failed to load champions');
          }
          this.isLoadingChampions = false;
        },
        error: (error) => {
          console.error('Error loading champions:', error);
          this.isLoadingChampions = false;
        },
      })
    );
  }

  private loadTheme() {
    this.subscriptions.push(
      this.themeService.theme$.subscribe((theme) => {
        this.currentTheme = theme;
      })
    );
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange(filter: 'all' | 'owned' | 'unowned') {
    this.currentFilter = filter;
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  private applyFilters() {
    if (!this.currentUser) return;

    this.filteredChampions = this.champions.filter((champion) => {
      const matchesSearch = champion
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());
      const isOwned = this.currentUser!.champs.includes(champion);

      const showBasedOnFilter =
        this.currentFilter === 'all' ||
        (this.currentFilter === 'owned' && isOwned) ||
        (this.currentFilter === 'unowned' && !isOwned);

      return matchesSearch && showBasedOnFilter;
    });
  }

  toggleChampion(champion: string) {
    if (!this.currentUser || this.loadingChampions.has(champion)) return;

    // Add to loading set
    this.loadingChampions.add(champion);

    // Optimistically update the UI
    const isCurrentlyOwned = this.currentUser.champs.includes(champion);
    const originalChamps = [...this.currentUser.champs];

    if (isCurrentlyOwned) {
      this.currentUser.champs = this.currentUser.champs.filter(
        (c) => c !== champion
      );
    } else {
      this.currentUser.champs.push(champion);
    }

    // Update auth service immediately
    this.authService['currentUserSubject'].next(this.currentUser);

    // Make API call in background
    this.subscriptions.push(
      this.championService.toggleChampion(champion).subscribe({
        next: async (response) => {
          if (response.success) {
            // API call successful, fetch fresh user data
            const freshUser = await this.authService.getCurrentUserFresh();
            if (freshUser) {
              this.currentUser = freshUser;
              this.authService['currentUserSubject'].next(this.currentUser);
            }
          } else {
            // Revert on error
            this.currentUser!.champs = originalChamps;
            this.authService['currentUserSubject'].next(this.currentUser);
            console.error('Error toggling champion:', response.message);
          }
          // Remove from loading set
          this.loadingChampions.delete(champion);
        },
        error: async (error) => {
          // Revert on error
          this.currentUser!.champs = originalChamps;
          this.authService['currentUserSubject'].next(this.currentUser);
          console.error('Error toggling champion:', error);
          // Remove from loading set
          this.loadingChampions.delete(champion);
        },
      })
    );
  }

  isChampionOwned(champion: string): boolean {
    return this.currentUser?.champs.includes(champion) || false;
  }

  isChampionLoading(champion: string): boolean {
    return this.loadingChampions.has(champion);
  }

  getChampionImageUrl(champion: string): string {
    const processedName = this.championService.processChampionName(champion);
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${processedName}_0.jpg`;
  }

  getProgressPercentage(): number {
    if (!this.currentUser || this.champions.length === 0) return 0;
    return (this.currentUser.champs.length / this.champions.length) * 100;
  }

  cycleTheme() {
    this.themeService.cycleTheme();
  }

  togglePublicState() {
    if (!this.currentUser || this.isPublicStateSwitching) return;

    this.isPublicStateSwitching = true;
    const newPublicState = !this.currentUser.public;

    // Optimistically update the UI immediately
    this.currentUser.public = newPublicState;
    this.authService['currentUserSubject'].next(this.currentUser);

    this.subscriptions.push(
      this.championService.setPublicState(newPublicState).subscribe({
        next: async (response) => {
          if (response.success) {
            // API call successful, fetch fresh user data to ensure consistency
            const freshUser = await this.authService.getCurrentUserFresh();
            if (freshUser) {
              this.currentUser = freshUser;
              this.authService['currentUserSubject'].next(this.currentUser);
            }
          } else {
            // Revert on error
            if (this.currentUser) {
              this.currentUser.public = !newPublicState;
              this.authService['currentUserSubject'].next(this.currentUser);
            }
            console.error('Error setting public state:', response.message);
          }
          this.isPublicStateSwitching = false;
        },
        error: (error) => {
          // Revert on error
          if (this.currentUser) {
            this.currentUser.public = !newPublicState;
            this.authService['currentUserSubject'].next(this.currentUser);
          }
          console.error('Error setting public state:', error);
          this.isPublicStateSwitching = false;
        },
      })
    );
  }

  openPublic(type: 'profile' | 'overlay') {
    if (this.currentUser?.username) {
      const publicProfileUrl = `${
        window.location.origin
      }/${type}?username=${encodeURIComponent(this.currentUser.username)}`;
      window.open(publicProfileUrl, '_blank');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getThemeButtonText(): string {
    const theme = this.themeService.getCurrentTheme();
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }
}
