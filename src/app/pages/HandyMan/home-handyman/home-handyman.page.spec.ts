import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeHandymanPage } from './home-handyman.page';

describe('HomeHandymanPage', () => {
  let component: HomeHandymanPage;
  let fixture: ComponentFixture<HomeHandymanPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeHandymanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
