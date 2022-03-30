import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BiometriaComponent } from './biometria.component';

describe('BiometriaComponent', () => {
  let component: BiometriaComponent;
  let fixture: ComponentFixture<BiometriaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BiometriaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BiometriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
