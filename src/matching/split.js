function split(line, max) {
  const tokens = [];
  let start = 0;

  for (let i = 0; i < max - 1; i++) {
    const pos = line.indexOf(" ", start);

    if (pos < 0) {
      throw new Error("Not enough tokens");
    }

    tokens.push(line.substring(start, pos));
    start = pos + 1;
  }

  if (start < line.length) {
    tokens.push(line.substring(start, line.length));
  }

  return tokens;
}

module.exports = { split };
