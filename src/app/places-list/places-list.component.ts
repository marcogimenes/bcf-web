import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-places-list',
  templateUrl: './places-list.component.html'
})
export class PlacesListComponent implements OnInit {

  locais = [];

  constructor(
    private localStorageService: LocalStorageService,
  ) {}

  ngOnInit() {
    this.localStorageService.getFromLocalStorage('locais').subscribe(locais => {
      this.locais = locais;
    });
  }
}
