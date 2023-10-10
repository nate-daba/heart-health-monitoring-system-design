import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeartRatePageComponent } from './heart-rate-page.component';

describe('HeartRatePageComponent', () => {
  let component: HeartRatePageComponent;
  let fixture: ComponentFixture<HeartRatePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HeartRatePageComponent]
    });
    fixture = TestBed.createComponent(HeartRatePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
