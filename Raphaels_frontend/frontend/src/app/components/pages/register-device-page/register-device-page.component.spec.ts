import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterDevicePageComponent } from './register-device-page.component';

describe('RegisterDevicePageComponent', () => {
  let component: RegisterDevicePageComponent;
  let fixture: ComponentFixture<RegisterDevicePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegisterDevicePageComponent]
    });
    fixture = TestBed.createComponent(RegisterDevicePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
