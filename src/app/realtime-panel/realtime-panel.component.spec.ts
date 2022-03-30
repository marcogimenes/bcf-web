import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtimePanelComponent } from './realtime-panel.component';

describe('RealtimePanelComponent', () => {
  let component: RealtimePanelComponent;
  let fixture: ComponentFixture<RealtimePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RealtimePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealtimePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
