import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ChampionListComponent } from './components/champion-list.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  declarations: [
    ChampionListComponent
  ],
  exports: [
    ChampionListComponent
  ]
})
export class SharedModule {}