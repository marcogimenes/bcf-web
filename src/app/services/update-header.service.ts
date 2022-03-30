import { observable, Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UpdateHeaderService {

  private subject = new Subject<any>();
  private subjectTitle = new Subject<any>();


  updated_observable$ = this.subject.asObservable();
  updated_title_observable$ = this.subjectTitle.asObservable();

  constructor() { }


  updateHeader() {
    this.subject.next(true);
  }

  hiddenSidebarHeader() {
    this.subject.next('hidden');
  }

  updateTitleHeader(title: string = 'Sem Título') {
    this.subjectTitle.next(title);
  }

}
