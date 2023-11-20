import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/partials/header/header.component';
import { DefaultButtonComponent } from './components/partials/default-button/default-button.component';
import { InputContainerComponent } from './components/partials/input-container/input-container.component';
import { InputValidationComponent } from './components/partials/input-validation/input-validation.component';
import { TextInputComponent } from './components/partials/text-input/text-input.component';
import { HomeComponent } from './components/pages/home/home.component';
import { LoginPageComponent } from './components/pages/login-page/login-page.component';
import { RegisterPageComponent } from './components/pages/register-page/register-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MeasurementPageComponent } from './components/pages/measurement-page/measurement-page.component';
import { LoginPhyPageComponent } from './components/pages/login-phy-page/login-phy-page.component';
import { ProfilePageComponent } from './components/pages/profile-page/profile-page.component';
import { RegisterDevicePageComponent } from './components/pages/register-device-page/register-device-page.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DefaultButtonComponent,
    InputContainerComponent,
    InputValidationComponent,
    TextInputComponent,
    HomeComponent,
    LoginPageComponent,
    RegisterPageComponent,
    MeasurementPageComponent,
    LoginPhyPageComponent,
    ProfilePageComponent,
    RegisterDevicePageComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      newestOnTop: false
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
