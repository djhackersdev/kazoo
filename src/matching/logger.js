class Logger {
  constructor(tag) {
    this.tag = tag;
  }

  log(message) {
    console.log(`Matching: ${this.tag}: ${message}`);
  }
}

module.exports = { Logger };
