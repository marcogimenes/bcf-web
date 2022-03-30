import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'sumIndex'})
export class SumIndexPipe implements PipeTransform {
  transform(value: number|string, valueToSum: number): number {
    if (typeof value === 'string') {
      return parseInt(value, 10) + valueToSum;
    } else {
      return value + valueToSum;
    }
  }
}
