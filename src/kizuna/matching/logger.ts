export class Logger {
  constructor(private _tag: string) {}

  log(arg: any, ...argv: any) {
    if (arg instanceof Error) {
      console.log(`Matching: ${this._tag}: Error:`);
      console.log(arg);
    } else {
      console.log(`Matching: ${this._tag}:`, ...arguments);
    }
  }
}
