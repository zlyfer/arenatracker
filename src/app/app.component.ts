import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private themeService: ThemeService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Theme service is already initialized in its constructor
      console.log('Arena Tracker initialized');
    });
  }
}
