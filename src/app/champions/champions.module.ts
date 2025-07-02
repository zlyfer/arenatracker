import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ChampionsPageRoutingModule } from './champions-routing.module';
import { ChampionsPage } from './champions.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChampionsPageRoutingModule
  ],
  declarations: [ChampionsPage]
})
export class ChampionsPageModule {}