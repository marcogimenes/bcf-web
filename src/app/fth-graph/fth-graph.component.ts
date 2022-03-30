import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-fth-graph',
  templateUrl: './fth-graph.component.html',
  styleUrls: ['./fth-graph.component.scss'],
})
export class FthGraphComponent implements OnChanges {
  centimeter_in_pixels;

  /*
    {
      value: 150,
      value_line_color: '#000',
      base_line: 148,
      date: new Date(),
    }
  */
  @Input() dataset = [];
  @Input() is_real_time = true;
  @Input() view_is_loaded = true;
  @Input() has_lost_focus = false;

  dataset_labels = [];

  // timer
  timeLeft = 60;
  interval;
  changeDevicePosition = false;
  hasLostFocusCount = 0;
  maxLostFocus = 2;

  @ViewChild('wrapper', { static: true }) wrapper_ref: ElementRef;
  wrapper;

  @ViewChild('label_x_wrapper', { static: true }) label_x_wrapper_ref: ElementRef;
  label_x_wrapper;

  @ViewChild('maingraph', { static: true }) main_canvas_ref: ElementRef<HTMLCanvasElement>;
  main_canvas;
  main_context: CanvasRenderingContext2D;

  // @ViewChild('interationgraph', { static: true }) interation_canvas_ref: ElementRef<HTMLCanvasElement>;
  // interation_canvas;
  // interation_context: CanvasRenderingContext2D;

  width;
  height;

  square_grid_size; // = this.centimeter_in_pixels / 2;  // It should be half centimenter
  label_y_font_size = 12; // px

  current_x = 0;
  current_y = 0;
  current_y2 = 0;

  time_scale; // cm/min

  // speed = 1.25;
  line_width = 1;
  grid_line_width = 0.4;
  border_line_width = 1;
  max_time_seconds = 0; // Dynamically updated

  // Range
  max_value_y = 210;
  min_value_y = 50;
  min_normal_value_y = 110;
  max_normal_value_y = 160;

  // Colors
  data_line_color = '#0064A9';
  base_line_color = 'rgba(102, 102, 102, .6)';
  normal_interval_color = 'rgba(102, 102, 102, .07)';
  labels_color = 'rgba(0, 0, 0, .4)';
  labels_bg_color = '#fff';
  grid_line_color = 'rgba(0, 0, 0, .3)';
  border_color = '#666';

  constructor(private localStorageService: LocalStorageService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['view_is_loaded']) {
      if (!changes['view_is_loaded'].previousValue && this.view_is_loaded) {
        this.draw();
      }
    } else if (changes['dataset']) {
      this.draw();
    }

    if (changes['has_lost_focus']) {
      if (this.has_lost_focus) {
        if (this.hasLostFocusCount >= this.maxLostFocus) {
          this.changeDevicePosition = true;
        } else {
          this.startTimer();
          this.hasLostFocusCount++;
        }
      } else {
        this.clearTimer();
      }
    }
  }

  getGraphMaxTime() {
    if (this.width) {
      return Math.round(((this.width / this.centimeter_in_pixels) * 60) / this.time_scale); // seconds
    }

    return 0;
  }

  async setupCanvas() {
    this.wrapper = this.wrapper_ref.nativeElement;
    this.label_x_wrapper = this.label_x_wrapper_ref.nativeElement;
    this.main_canvas = this.main_canvas_ref.nativeElement;
    // this.interation_canvas = this.interation_canvas_ref.nativeElement;

    const wrapper_width = Math.round(this.wrapper.getBoundingClientRect().width);
    if (this.dataset.length && !this.is_real_time) {
      const last_value = this.dataset[this.dataset.length - 1];
      const last_coordinate = this.toDomXCoord(last_value.date);
      this.width = last_coordinate > wrapper_width ? last_coordinate : wrapper_width;
    } else {
      this.width = wrapper_width;
    }

    this.height = Math.round(
      this.wrapper.getBoundingClientRect().height -
      this.label_x_wrapper.getBoundingClientRect().height - 1
    );

    if (!this.is_real_time) {
      this.height -= 20; // Scroll height size
    }

    this.main_canvas.width = this.width;
    this.main_canvas.height = this.height;
    // this.interation_canvas.width = this.width;
    // this.interation_canvas.height = this.height;
    this.label_x_wrapper.style.width = `${this.width}px`;

    const screenSettings = await this.localStorageService.getFromLocalStorage('screenSettings').toPromise();
    const { tela_polegadas, tela_resh, tela_resv, graf_escala } = screenSettings;

    this.centimeter_in_pixels = Math.sqrt(Math.pow(tela_resh, 2) + Math.pow(tela_resv, 2)) / tela_polegadas / 2.54;
    this.time_scale = graf_escala;
    this.square_grid_size = this.centimeter_in_pixels / 2 / window.devicePixelRatio;
    this.max_time_seconds = this.getGraphMaxTime();

    this.main_context = this.main_canvas.getContext('2d');
    // this.interation_context = this.interation_canvas.getContext('2d');
  }

  toDomYCoord(value: number, precise_coord = false) {
    const interpolation =
      (this.height - 0) * ((value - this.min_value_y) / (this.max_value_y - this.min_value_y));
    const coord = this.height - interpolation;
    return precise_coord ? coord : Math.floor(coord) + 0.5;  // https://diveintohtml5.info/canvas.html
  }

  toDomXCoord(next_value_date, precise_coord = false) {
    const first_value = this.dataset[0];
    const seconds_diff = (next_value_date - first_value.date) / 1000;
    const pixels_diff = ((seconds_diff * this.time_scale) / 60) * this.centimeter_in_pixels;
    return precise_coord ? pixels_diff : Math.floor(pixels_diff) + 0.5;  // https://diveintohtml5.info/canvas.html
  }

  resetCurrentCoordinates() {
    this.current_x = 0;
    this.current_y = 0;
    this.current_y2 = 0;
  }

  clearMainCanvas() {
    this.main_context.clearRect(0, 0, this.width, this.height);
  }

  drawNormalInterval() {
    const top_left =  this.toDomYCoord(this.max_normal_value_y);
    const bottom_left = this.toDomYCoord(this.min_normal_value_y);
    this.main_context.fillStyle = this.normal_interval_color;
    this.main_context.fillRect(0, top_left, this.width, bottom_left - top_left);
  }

  calculateNextCoordinates(index) {
    return {
      next_x: this.toDomXCoord(this.dataset[index].date),
      next_y: this.toDomYCoord(this.dataset[index].value),
      next_y2: this.toDomYCoord(this.dataset[index].base_line),
    };
  }

  setLabelsYAxis = () => {
    this.main_context.font = `bold ${this.label_y_font_size}px Lato`;

    for (let i = this.min_value_y + 10; i <= this.max_value_y - 10; i += 10) {
      if (i > this.min_value_y && i < this.max_value_y && i % 20 === 0) {
        const graph_coord_y = this.toDomYCoord(i);

        const text_width = this.main_context.measureText(`${i}`).width;
        const position_x_centralized = (this.centimeter_in_pixels - text_width) / 2;

        for (
          let position_x = 0;
          position_x <= this.width - this.square_grid_size;
          position_x += 10 * this.square_grid_size
        ) {
          this.main_context.fillStyle = this.labels_bg_color;
          this.main_context.fillRect(
            position_x_centralized + position_x,
            graph_coord_y - this.label_y_font_size / 2,
            text_width + 1,
            this.label_y_font_size,
          );

          this.main_context.fillStyle = this.labels_color;
          this.main_context.fillText(
            `${i}`,
            position_x_centralized + position_x,
            graph_coord_y + this.label_y_font_size / 2 / 2,
          );
        }
      }
    }
  };

  setLabelsXAxis() {
    if (this.dataset.length) {
      const first_value = this.dataset[0];
      const last_value = this.dataset[this.dataset.length - 1];

      this.dataset_labels = [{ date: first_value.date, x: 0 }];

      let next_date = new Date(first_value.date.getTime() + 5 * 60000);
      while (next_date <= last_value.date) {
        this.dataset_labels.push({ date: next_date, x: Math.floor(this.toDomXCoord(next_date, true)) });
        next_date = new Date(next_date.getTime() + 5 * 60000);
      }

      // this.dataset_labels.push({date: last_value.date, x: last_value.x});
    } else {
      this.dataset_labels = [];
    }
  }

  setGrid() {
    this.main_context.beginPath();

    // Borders
    this.main_context.moveTo(0, 0);
    this.main_context.lineTo(this.width, 0);

    this.main_context.moveTo(this.width, 0);
    this.main_context.lineTo(this.width, this.height);

    this.main_context.moveTo(this.width, this.height);
    this.main_context.lineTo(0, this.height);

    this.main_context.moveTo(0, this.height);
    this.main_context.lineTo(0, 0);

    this.main_context.strokeStyle = this.border_color;
    this.main_context.lineWidth = this.border_line_width;
    this.main_context.stroke();

    // Vertical Lines
    for (let i = this.square_grid_size; i <= this.width; i += this.square_grid_size) {
      const value = Math.floor(i) + 0.5; // https://diveintohtml5.info/canvas.html
      this.main_context.moveTo(value, 0);
      this.main_context.lineTo(value, this.height);
    }

    // Horizontal Lines
    for (let i = this.min_value_y; i <= this.max_value_y; i += 5) {
      const graph_coord_y = this.toDomYCoord(i);

      // it should draw only if not reach the borders
      if (graph_coord_y > 0 && graph_coord_y < this.height) {
        this.main_context.moveTo(0, graph_coord_y);
        this.main_context.lineTo(this.width, graph_coord_y);
      }
    }

    this.main_context.strokeStyle = this.grid_line_color;
    this.main_context.lineWidth = this.grid_line_width;
    this.main_context.stroke();
  }

  drawData = () => {
    this.resetCurrentCoordinates();

    this.main_context.lineJoin = 'miter';
    this.main_context.lineWidth = this.line_width;

    for (let i = 0; i < this.dataset.length; i++) {
      // Calculates coordinates for the next point
      const { next_x, next_y, next_y2 } = this.calculateNextCoordinates(i);

      if (i === 0) {
        this.current_x = next_x;
        this.current_y = next_y;
        this.current_y2 = next_y2;
      }

      // ###### BASE LINE
      const is_last_base_line_point_valid = i > 0 && this.dataset[i - 1].base_line > 0;
      if (!is_last_base_line_point_valid) {
        // Update current y2 coordinate before draw
        this.current_y2 = next_y2;
        this.dataset[i]['y2'] = this.current_y2;
      }

      if (this.dataset[i].base_line > 0) {
        // Draws base line data
        this.main_context.beginPath();
        this.main_context.strokeStyle = this.base_line_color;
        this.main_context.moveTo(this.current_x, this.current_y2);
        this.main_context.lineTo(next_x, next_y2);
        this.main_context.stroke();
      }

      // Update current y2 coordinate
      this.current_y2 = next_y2;
      this.dataset[i]['y2'] = this.current_y2;
      // ###### /BASE LINE

      // ###### VALUE
      const is_last_value_point_valid = i > 0 && this.dataset[i - 1].value > 0;
      if (!is_last_value_point_valid) {
        // Update current y coordinate before draw
        this.current_y = next_y;
        this.dataset[i]['y'] = this.current_y;
      }

      if (this.dataset[i].value > 0) {
        // Draws main line data
        this.main_context.beginPath();
        this.main_context.strokeStyle = this.dataset[i].value_line_color
          ? this.dataset[i].value_line_color
          : this.data_line_color;
        this.main_context.moveTo(this.current_x, this.current_y);
        this.main_context.lineTo(next_x, next_y);
        this.main_context.stroke();
      }

      // Update current y coordinate
      this.current_y = next_y;
      this.dataset[i]['y'] = this.current_y;
      // ###### /VALUE

      // Update the current x coordinate
      this.current_x = next_x;
      this.dataset[i]['x'] = this.current_x;
    }
  };

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.draw();
  }

  async draw() {
    // Setup canvas properties
    await this.setupCanvas();

    // Clears the entire main canvas in order to draw or redraw
    this.clearMainCanvas();

    // Creates the grid
    this.setGrid();

    // Creates Y Axis Labels
    this.setLabelsYAxis();

    // Creates the normal interval
    this.drawNormalInterval();

    // Draw graph data
    this.drawData();

    // Creates X Axis labels
    this.setLabelsXAxis();
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.changeDevicePosition = true;
        this.timeLeft = 60;
      }
    }, 1000);
  }

  clearTimer() {
    clearInterval(this.interval);
    this.timeLeft = 60;
    this.changeDevicePosition = false;
  }
}
