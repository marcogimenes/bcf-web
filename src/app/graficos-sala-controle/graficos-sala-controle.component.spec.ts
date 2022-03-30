import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficosSalaControleComponent } from './graficos-sala-controle.component';

describe('GraficosSalaControleComponent', () => {
  let component: GraficosSalaControleComponent;
  let fixture: ComponentFixture<GraficosSalaControleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraficosSalaControleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficosSalaControleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
