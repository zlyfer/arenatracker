import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OverlayPage } from './overlay.page';

const routes: Routes = [
  {
    path: '',
    component: OverlayPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OverlayPageRoutingModule {}