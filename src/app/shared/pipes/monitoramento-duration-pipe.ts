import { Pipe, PipeTransform } from '@angular/core';
/*
 * Raise the value exponentially
 * Takes an exponent argument that defaults to 1.
 * Usage:
 *   value | exponentialStrength:exponent
 * Example:
 *   {{ 2 | exponentialStrength:10 }}
 *   formats to: 1024
*/
@Pipe({name: 'monitoramentoDuration'})
export class MonitoramentoDurationPipe implements PipeTransform {
  transform(value_ms: number): string {
    const value_seconds = value_ms / 1000;
    const minutes = Math.floor(value_seconds / 60);
    const seconds = value_seconds % 60;

    const minutes_str = minutes < 10 ? `0${minutes}` : minutes.toString();
    const seconds_str = seconds < 10 ? `0${seconds}` : seconds.toString();

    return `${minutes_str}m ${seconds_str}s`;
  }
}
