import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/pages/home/home.component';
import { LoginPageComponent } from './components/pages/login-page/login-page.component';
import { LoginPhyPageComponent } from './components/pages/login-phy-page/login-phy-page.component';
import { RegisterPageComponent } from './components/pages/register-page/register-page.component';
import { MeasurementPageComponent } from './components/pages/measurement-page/measurement-page.component'

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'login-phy', component: LoginPhyPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'measurements', component: MeasurementPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
