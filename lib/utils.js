function cut(code) {
    if (!code) return "";
    let cleaned = "";
    for (let i = 0; i < code.length; i++) {
        if (code[i] === "/") {
            if (code[i + 1] === "/") {
                while (i < code.length && code[i] !== "\n") {
                    i++;
                }
                continue;
            }
            else if (code[i + 1] === "*") {
                i += 2;
                while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
                    i++;
                }
                i++;
                continue;
            }
        }
        cleaned += code[i];
    }
    let lines = cleaned
        .split(/\r\n|\r|\n/)
        .map(line => line.trim())
        .filter(line => line !== "");
    return lines.join("\n");
}

function numOfLines(code) {
    if (!code) return 0;
    return code.split(/\r\n|\r|\n/).length;
}

module.exports = { cut, numOfLines };

