import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientBoxRealtimeChartComponent } from './patient-box-realtime-chart.component';

describe('PatientBoxRealtimeChartComponent', () => {
  let component: PatientBoxRealtimeChartComponent;
  let fixture: ComponentFixture<PatientBoxRealtimeChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PatientBoxRealtimeChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PatientBoxRealtimeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
