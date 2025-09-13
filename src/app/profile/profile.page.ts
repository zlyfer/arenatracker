import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ChampionService, PublicUserResponse } from '../services/champion.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit, OnDestroy {
  username: string = '';
  user: any = null;
  champions: string[] = [];
  isLoading = true;
  errorMessage = '';
  progressPercentage = 0;
  lastFiveChampions: string[] = [];
  loadingChampions: Set<string> = new Set();
  championListConfig = {
    clickable: false,
    showCheckmarks: true,
    showLoadingStates: false,
    gridColumns: 4,
  };

  // Toggle state for showing completed vs missing champions
  showCompletedChampions = true;

  private refreshInterval: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private championService: ChampionService,
    private themeService: ThemeService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        this.username = params['username'];
        // Handle toggle state from URL parameter
        if (params['view'] === 'missing') {
          this.showCompletedChampions = false;
        } else {
          this.showCompletedChampions = true;
        }

        if (this.username) {
          this.initializePublicProfile();
          this.startAutoRefresh();
        } else {
          this.showError('No username provided');
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  private initializePublicProfile() {
    this.isLoading = true;
    this.errorMessage = '';
    this.fetchPublicProfile();
  }

    private fetchPublicProfile() {
    this.subscriptions.push(
      this.championService.getPublicUser(this.username).subscribe({
        next: (response: PublicUserResponse) => {
          if (response.success && response.user) {
            // Force change detection by creating a new object reference
            this.user = { ...response.user };
            this.loadChampionsAndRender();
          } else {
            this.showError(response.message || 'Failed to load profile');
          }
        },
        error: (error) => {
          console.error('Error fetching public profile:', error);
          if (error.status === 403) {
            this.showError('This profile is private');
          } else if (error.status === 404) {
            this.showError('User not found');
          } else {
            this.showError('Failed to load profile');
          }
        },
        complete: () => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadChampionsAndRender() {
    this.subscriptions.push(
      this.championService.getChampions().subscribe({
        next: (response) => {
          if (response.success) {
            this.champions = response.champions;
            this.renderPublicProfile();
          } else {
            this.renderLastFiveChampions();
          }
        },
        error: (error) => {
          console.error('Error fetching champions:', error);
          this.renderLastFiveChampions();
        }
      })
    );
  }

  private renderPublicProfile() {
    if (!this.user) return;

    // Calculate progress
    this.progressPercentage = this.champions.length > 0
      ? Math.round((this.user.champs.length / this.champions.length) * 100)
      : 0;

    // Get last 5 champions
    this.lastFiveChampions = this.user.champs.slice(-5).reverse();
  }

  private renderLastFiveChampions() {
    if (!this.user) return;
    this.lastFiveChampions = this.user.champs.slice(-5).reverse();
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.isLoading = false;
    this.progressPercentage = 0;
    this.lastFiveChampions = [];
  }

  private startAutoRefresh() {
    // Refresh every 60 seconds
    this.refreshInterval = interval(60000).subscribe(() => {
      if (this.username) {
        this.fetchPublicProfile();
      }
    });
  }

  getChampionImageUrl(champion: string): string {
    const processedName = this.championService.processChampionName(champion);
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${processedName}_0.jpg`;
  }

  getTotalChampions(): number {
    return this.user ? this.user.champs.length : 0;
  }

  getAvailableChampions(): number {
    return this.champions.length;
  }

  getReversedChampions(): string[] {
    if (!this.user?.champs) return [];
    // Force change detection by creating a new array
    const reversed = [...this.user.champs].reverse();
    return reversed;
  }

  cycleTheme() {
    this.themeService.cycleTheme();
  }

  getThemeButtonText(): string {
    const theme = this.themeService.getCurrentTheme();
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  // Get champions based on toggle state
  getFilteredChampions(): string[] {
    if (!this.user || !this.champions.length) return [];

    if (this.showCompletedChampions) {
      // Show completed champions (owned by user)
      return [...this.user.champs].reverse();
    } else {
      // Show missing champions (not owned by user)
      return this.champions.filter(champion => !this.user.champs.includes(champion));
    }
  }

  // Toggle between completed and missing champions
  toggleChampionView() {
    this.showCompletedChampions = !this.showCompletedChampions;
    this.updateUrl();
  }

  // Handle segment change
  onSegmentChange(event: any) {
    this.showCompletedChampions = event.detail.value === 'true';
    this.updateUrl();
  }

  // Update URL with current toggle state
  private updateUrl() {
    const queryParams = {
      username: this.username,
      view: this.showCompletedChampions ? 'completed' : 'missing'
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
  }

  // Get count for current view
  getCurrentViewCount(): number {
    if (this.showCompletedChampions) {
      return this.user ? this.user.champs.length : 0;
    } else {
      return this.champions.length - (this.user ? this.user.champs.length : 0);
    }
  }
}