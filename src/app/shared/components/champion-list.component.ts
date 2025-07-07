import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChampionService } from '../../services/champion.service';

export interface ChampionListConfig {
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
    clickable: true,
    showCheckmarks: true,
    showLoadingStates: true,
    gridColumns: 6,
  };

  @Output() championClick = new EventEmitter<string>();

  private subscriptions: Subscription[] = [];

  constructor(private championService: ChampionService) {}

  ngOnInit() {
    // Component is now simpler, no initialization needed
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
}