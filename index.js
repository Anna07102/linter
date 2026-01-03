const utils = require('./lib/utils');
const metrics = require('./lib/metrics');

const code = `// small comment
/*very
big
comment*/

function dddd(a) {
    if (a) {
        for (let b = 1; b < 10; b++) {
            while (c) {
                let num = 5;
                b++;
                if (b) const mun = 10;
            }
        }
    }
}`;

console.log(metrics.output(utils.cut(code)));
