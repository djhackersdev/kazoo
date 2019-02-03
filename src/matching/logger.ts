export class Logger {
  constructor(private _tag: string) {}

  log(message: string | Error) {
    if (message instanceof Error) {
      console.log(`Matching: ${this._tag}: Error:`);
      console.log(message);
    } else {
      console.log(`Matching: ${this._tag}: ${message}`);
    }
  }
}
