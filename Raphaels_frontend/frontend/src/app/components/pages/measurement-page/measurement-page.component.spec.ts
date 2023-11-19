import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementPageComponent } from './measurement-page.component';

describe('MeasurementPageComponent', () => {
  let component: MeasurementPageComponent;
  let fixture: ComponentFixture<MeasurementPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MeasurementPageComponent]
    });
    fixture = TestBed.createComponent(MeasurementPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
