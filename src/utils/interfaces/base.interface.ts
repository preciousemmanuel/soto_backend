export interface BackDaterResponse extends Object {
  format: string;
  array: backDaterArray[]
}

export interface backDaterArray extends Object {
  start: Date;
  end: Date;
  day?: string;
  month?: string
}