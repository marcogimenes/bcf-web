import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private alert_audio: HTMLAudioElement;

  constructor(private location: Location) {
    this.alert_audio = new Audio(this.location.prepareExternalUrl('assets/sounds/alert.ogg'));
  }

  playAlert(seconds = 4, callback?: Function) {
    this.alert_audio.loop = true;
    this.alert_audio.play();
    setTimeout(() => {
      this.alert_audio.load();
      if (callback) {
        callback();
      }
    }, seconds * 1000);
  }
}
