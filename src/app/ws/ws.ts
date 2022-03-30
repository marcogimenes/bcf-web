import { Subject } from 'rxjs';


export class WS {
  private url: string;
  private timeout: number;
  private reconnection_time: number;
  private reconnection_timeout_ref = null;
  private websocket: WebSocket;
  private websocketSubject: Subject<Event>;

  constructor(url: string, timeout: number = 10000, reconnection_time: number = 15000) {
    this.url = url;
    this.timeout = timeout;
    this.reconnection_time = reconnection_time;
    this.createSubjectWS();
    this.connectWS();
  }

  wsIsOpen() {
    return this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }

  private connectWS() {
    this.clearReconnectTimeoutWS();

    if (this.wsIsOpen()) {
      this.disconnectWS();
    }

    this.websocket = new WebSocket(this.url);
    this.websocket.onopen = (event) => this.emitWSEvent(event);
    this.websocket.onmessage = (event) => this.emitWSEvent(event);
    this.websocket.onclose = (event) => this.emitWSEvent(event);
    this.websocket.onerror = (event) => this.emitWSEvent(event);

    setTimeout(() => {
      if (!this.wsIsOpen()) {
        this.disconnectWS();
        console.error(`${this.websocket.url} connection timeout`);
      }
    }, this.timeout);
  }

  private emitWSEvent(event: Event | MessageEvent | CloseEvent) {
    if (event instanceof Event && event.type === 'error' || event instanceof CloseEvent) {
      this.setReconnectTimeoutWS(event);
    }

    this.websocketSubject.next(event);
  }

  private setReconnectTimeoutWS(event: Event | CloseEvent) {
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
    // error code 1000 means the client disconnected without any errors
    if (!(event instanceof CloseEvent && event.code === 1000) && !this.reconnection_timeout_ref) {
      this.reconnection_timeout_ref = setTimeout(() => this.connectWS(), this.reconnection_time);
    }
  }

  private clearReconnectTimeoutWS() {
    if (this.reconnection_timeout_ref) {
      clearTimeout(this.reconnection_timeout_ref);
      this.reconnection_timeout_ref = null;
    }
  }

  private disconnectWS() {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  private createSubjectWS() {
    this.websocketSubject = new Subject<Event>();
  }

  getAsObservable() {
    return this.websocketSubject.asObservable();
  }

  destroy() {
    this.clearReconnectTimeoutWS();
    this.disconnectWS();
    this.websocketSubject.complete();
  }
}
