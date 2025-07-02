import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { PublicProfilePageRoutingModule } from './public-profile-routing.module';
import { PublicProfilePage } from './public-profile.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    PublicProfilePageRoutingModule
  ],
  declarations: [PublicProfilePage]
})
export class PublicProfilePageModule {}