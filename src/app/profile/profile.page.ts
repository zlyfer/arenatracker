import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { ChampionService, PublicUserResponse } from '../services/champion.service';

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
    showSearch: false,
    showFilters: false,
    showProgress: false,
    clickable: false,
    showCheckmarks: true,
    showLoadingStates: false,
    gridColumns: 4,
  };

  private refreshInterval: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private championService: ChampionService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.username = params['username'];
      if (this.username) {
        this.initializePublicProfile();
        this.startAutoRefresh();
      } else {
        this.showError('No username provided');
      }
    });
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
            this.user = response.user;
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
    this.refreshInterval = interval(10000).subscribe(() => {
      if (this.username) {
        console.log('Auto-refreshing profile data...');
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
    return this.user?.champs ? [...this.user.champs].reverse() : [];
  }
}