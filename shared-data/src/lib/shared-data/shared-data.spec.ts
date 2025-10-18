import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedData } from './shared-data';

describe('SharedData', () => {
  let component: SharedData;
  let fixture: ComponentFixture<SharedData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedData],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
