import { TraceSettings } from '../workers/protocol';

export class HistoryTracker {
  private stack: TraceSettings[] = [];
  private pointer = -1;
  private maxHistory = 50;

  constructor(initial: TraceSettings) {
    this.push(initial);
  }

  public push(settings: TraceSettings): void {
    if (this.pointer >= 0 && JSON.stringify(this.stack[this.pointer]) === JSON.stringify(settings)) {
      return;
    }
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(JSON.parse(JSON.stringify(settings)));
    if (this.stack.length > this.maxHistory) {
      this.stack.shift();
    }
    this.pointer = this.stack.length - 1;
  }

  public undo(): TraceSettings | null {
    if (this.canUndo()) {
      this.pointer--;
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    return null;
  }

  public redo(): TraceSettings | null {
    if (this.canRedo()) {
      this.pointer++;
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    return null;
  }

  public canUndo(): boolean {
    return this.pointer > 0;
  }

  public canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }
}
