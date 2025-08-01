import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ChampionListComponent } from './components/champion-list.component';
import { SupportDialogComponent } from './components/support-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  declarations: [
    ChampionListComponent,
    SupportDialogComponent
  ],
  exports: [
    ChampionListComponent,
    SupportDialogComponent
  ]
})
export class SharedModule {}