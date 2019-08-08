import startKizuna from "./kizuna";
import startMaxi from "./maxi";

const mode = process.argv[2];

if (mode === "kizuna") {
  startKizuna();
} else if (mode === "maxi") {
  startMaxi();
} else {
  console.log("Command line arg must be 'kizuna' or 'maxi'");
}
