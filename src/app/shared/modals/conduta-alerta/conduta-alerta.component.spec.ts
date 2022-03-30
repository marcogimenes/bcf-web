import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CondutaAlertaComponent } from './conduta-alerta.component';

describe('CondutaAlertaComponent', () => {
  let component: CondutaAlertaComponent;
  let fixture: ComponentFixture<CondutaAlertaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CondutaAlertaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CondutaAlertaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
