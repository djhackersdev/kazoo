class Logger {
  constructor(tag) {
    this.tag = tag;
  }

  log(message) {
    if (message instanceof Error) {
      console.log(`Matching: ${this.tag}: Error:`);
      console.log(message);
    } else {
      console.log(`Matching: ${this.tag}: ${message}`);
    }
  }
}

module.exports = { Logger };
