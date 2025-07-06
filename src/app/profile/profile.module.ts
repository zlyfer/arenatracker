import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';
import { ProfilePage } from './profile.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ProfilePageRoutingModule,
    SharedModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}