const hoursPerDay = 24;
const millisecondsPerSecond = 1000;
const minutesPerHour = 60;
const oneHalfHourMinutes = 90;
const minutesPerDay = hoursPerDay * minutesPerHour;
const secondsPerMinute = 60;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

export function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}


function toHours(milliseconds) {
  return Math.round(milliseconds / millisecondsPerSecond / secondsPerMinute / minutesPerHour);
}

function toMinutes(milliseconds) {
  return Math.ceil(milliseconds / millisecondsPerSecond / secondsPerMinute);
}

function toDays(milliseconds) {
  return Math.ceil(milliseconds / millisecondsPerSecond / secondsPerMinute / minutesPerHour / hoursPerDay);
}

export function howLong(registro, time) {
  let milliseconds;


  if (registro?.status === 'late' && !registro?.is_primeiro_registro) {
    milliseconds = registro?.data_prevista_inicio.getTime() + registro?.tolerancia * millisecondsPerMinute - time.getTime();

  } else {
    milliseconds = registro?.data_prevista_inicio.getTime() - time.getTime();
  }

  const minutes = toMinutes(milliseconds);

  if (Math.abs(minutes) >= minutesPerDay) {
    return `${Math.abs(toDays(milliseconds))} d`;
  }


  if (Math.abs(minutes) >= minutesPerHour) {
    return `${Math.abs(toHours(milliseconds))} h`;
  }

  if (Math.abs(minutes) < minutesPerHour) {

    if (registro?.status === 'late') {
      return `${Math.abs(minutes)} m`;

    } else {
      return `${minutes} m`;
    }
  }
}

export function statusAgenda(registro, time) {
  if (registro.data_prevista_inicio) {
    if (registro?.is_primeiro_registro) {
      if (time.getTime() > registro?.data_prevista_inicio.getTime() - registro?.tolerancia * millisecondsPerMinute && time.getTime() <= registro?.data_prevista_inicio.getTime()) {
        return {...registro,  status: 'on-tolerance'};
      }
      if (registro?.data_prevista_inicio.getTime() < time.getTime()) {
        return {...registro, status: 'late'};
      }
      return {...registro,  status: 'on-time'};
    } else if (time.getTime() > registro?.data_prevista_inicio.getTime()  && time.getTime() <= registro?.data_prevista_inicio.getTime()  + registro?.tolerancia * millisecondsPerMinute) {
      return {...registro,  status: 'on-tolerance'};
    } else if (time.getTime() >= registro?.data_prevista_inicio.getTime() - registro?.tolerancia * millisecondsPerMinute && time.getTime() <= registro?.data_prevista_inicio.getTime()) {
      return {...registro, status: 'on-time'};
    } else if (time.getTime() > registro?.data_prevista_inicio.getTime() + registro?.tolerancia * millisecondsPerMinute ) {
      return {...registro, status: 'late'};
    } else if (time.getTime() < registro?.data_prevista_inicio.getTime() - registro?.tolerancia * millisecondsPerMinute ) {
      return {...registro, status: 'on-time'};
    }
  }
  return registro;
}
