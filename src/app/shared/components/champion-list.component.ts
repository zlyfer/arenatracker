import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChampionService } from '../../services/champion.service';

export interface ChampionListConfig {
  showSearch?: boolean;
  showFilters?: boolean;
  showProgress?: boolean;
  clickable?: boolean;
  showCheckmarks?: boolean;
  showLoadingStates?: boolean;
  gridColumns?: number;
}

@Component({
  selector: 'app-champion-list',
  templateUrl: './champion-list.component.html',
  styleUrls: ['./champion-list.component.scss'],
  standalone: false
})
export class ChampionListComponent implements OnInit, OnDestroy {
  @Input() champions: string[] = [];
  @Input() ownedChampions: string[] = [];
  @Input() loadingChampions: Set<string> = new Set();
  @Input() config: ChampionListConfig = {
    showSearch: true,
    showFilters: true,
    showProgress: true,
    clickable: true,
    showCheckmarks: true,
    showLoadingStates: true,
    gridColumns: 6,
  };

  @Output() championClick = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<'all' | 'owned' | 'unowned'>();

  filteredChampions: string[] = [];
  searchTerm = '';
  currentFilter: 'all' | 'owned' | 'unowned' = 'all';
  allChampions: string[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private championService: ChampionService) {}

  ngOnInit() {
    this.loadAllChampions();
    this.applyFilters();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAllChampions() {
    this.subscriptions.push(
      this.championService.getChampions().subscribe({
        next: (response) => {
          if (response.success) {
            this.allChampions = response.champions;
            this.applyFilters();
          }
        },
        error: (error) => {
          console.error('Error loading champions:', error);
        }
      })
    );
  }

  onSearchChange() {
    this.applyFilters();
    this.searchChange.emit(this.searchTerm);
  }

  onFilterChange(filter: 'all' | 'owned' | 'unowned') {
    this.currentFilter = filter;
    this.applyFilters();
    this.filterChange.emit(filter);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
    this.searchChange.emit('');
  }

  private applyFilters() {
    this.filteredChampions = this.champions.filter((champion) => {
      const matchesSearch = champion
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase());
      const isOwned = this.ownedChampions.includes(champion);

      const showBasedOnFilter =
        this.currentFilter === 'all' ||
        (this.currentFilter === 'owned' && isOwned) ||
        (this.currentFilter === 'unowned' && !isOwned);

      return matchesSearch && showBasedOnFilter;
    });
  }

  onChampionClick(champion: string) {
    if (this.config.clickable) {
      this.championClick.emit(champion);
    }
  }

  isChampionOwned(champion: string): boolean {
    return this.ownedChampions.includes(champion);
  }

  isChampionLoading(champion: string): boolean {
    return (this.config.showLoadingStates ?? true) && this.loadingChampions.has(champion);
  }

  getChampionImageUrl(champion: string): string {
    const processedName = this.championService.processChampionName(champion);
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${processedName}_0.jpg`;
  }

  getProgressPercentage(): number {
    if (this.allChampions.length === 0) return 0;
    return (this.ownedChampions.length / this.allChampions.length) * 100;
  }

  getProgressText(): string {
    return `${this.ownedChampions.length}/${this.allChampions.length}`;
  }
}