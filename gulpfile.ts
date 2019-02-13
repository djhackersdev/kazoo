// Lest you get too enamored with TypeScript, the Node build story is kind of
// still a piece of crap. Gulp seems to be the least-worst option at the moment
// but it still has way too much magical bullshit in it. Try using a function
// expression that isn't assigned to a module-scoped variable for example. You
// can't, so you can't define a higher-order function to create a pattern of
// tasks that you can then instantiate with different parameters. So basically
// a function is not a function due to quasi-syntactical bullshit.

import { dest, series, src } from "gulp";
import { pbjs, pbts } from "gulp-protobuf";
import { createProject } from "gulp-typescript";

//
// Defs
//

const project = createProject("tsconfig.json");
const protos = ["gk4_db_msg", "pegasus"];

const protoFiles = protos.map(x => `protobuf/${x}.proto`);
const protojsFiles = protos.map(x => `generated/${x}.js`);

//
// Tasks
//

function generateJs() {
  return src(protoFiles)
    .pipe(
      pbjs({
        target: "static-module",
        wrap: "commonjs",
      })
    )
    .pipe(dest("generated"));
}

function generateTs() {
  return src(protojsFiles)
    .pipe(pbts({}))
    .pipe(dest("generated"));
}

export function transpile() {
  return project
    .src()
    .pipe(project())
    .js.pipe(dest("bin"));
}

export const generate = series(generateJs, generateTs);

export default series(generate, transpile);
