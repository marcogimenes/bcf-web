import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import { WS } from '../ws/ws';

@Injectable()
export class WebSocketService {
  private BATIMENTOS_FETAIS_WEBSOCKET_BASE_URL;
  private WEBSOCKET_TIMEOUT = 10000; // 10 seg

  constructor(private config: AppConfig) {
    this.BATIMENTOS_FETAIS_WEBSOCKET_BASE_URL = this.config.getConfig('BATIMENTOS_FETAIS_WEBSOCKET_BASE_URL');
  }

  connectWsLive(base: string, posto: string, reconectionTime: number = 15000): WS {
    const url = `${this.BATIMENTOS_FETAIS_WEBSOCKET_BASE_URL}/${base}/${posto}`;
    return new WS(url, this.WEBSOCKET_TIMEOUT, reconectionTime);
  }
}
