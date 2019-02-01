const { split } = require("./split");

test("basic", () => {
  expect(split("a b c d e", 3)).toEqual(["a", "b", "c d e"]);
});
