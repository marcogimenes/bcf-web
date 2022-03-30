import { Pipe, PipeTransform } from '@angular/core';


@Pipe({name: 'nullBooleanString'})
export class NullBooleanStringPipe implements PipeTransform {
  transform(value: number|null|boolean): string {
    if (value === null) {
      return '-';
    } else if (value) {
      return 'Sim';
    } else {
      return 'Não';
    }
  }
}
