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

function tokenize(code) {
    return code.match(/if\s*\([^)]*\)|{|}|;|[^\s{};]+/g) || [];
}
function parseStatement(tokens, pos = 0) {
    let token = tokens[pos];
    if (!token) return [null, pos];
    if (token.startsWith("if")) {
        let node = { type: "if", condition: token, body: [] };
        pos++;
        if (tokens[pos] === "{") {
            pos++;
            while (tokens[pos] && tokens[pos] !== "}") {
                let [child, newPos] = parseStatement(tokens, pos);
                pos = newPos;
                if (child) node.body.push(child);
            }
            pos++;
        } else {
            let [child, newPos] = parseStatement(tokens, pos);
            pos = newPos;
            if (child) node.body.push(child);
        }
        return [node, pos];
    }
    if (token === "{" || token === "}" || token === ";") {
        return [null, pos + 1];
    }
    return [{ type: "stmt", value: token }, pos + 1];
}
function parseStatements(code, pos = 0) {
    const tokens = tokenize(code);
    let result = [];
    while (pos < tokens.length) {
        let [stmt, newPos] = parseStatement(tokens, pos);
        pos = newPos;
        if (stmt) result.push(stmt);
    }
    return result;
}
function getDepth(node, level = 0) {
    if (!node) return level;
    if (Array.isArray(node)) {
        return node.reduce((max, child) => Math.max(max, getDepth(child, level)), level);
    }
    if (node.type === "if") {
        let childDepth = getDepth(node.body, level + 1);
        return Math.max(level + 1, childDepth);
    }
    return level;
}

function clarity(code) {
    const lines = numOfLines(code);
    if (lines === 0) return 0;
    const d = getDepth(parseStatements(code));
    const loops = numOfLoops(code);
    const avgName = averageLengthOfNames(code);
    const score =
        (1 / (d + 1)) * 0.3 +
        (1 / (loops + 1)) * 0.4 +
        (avgName / 10) * 0.3;
    return score.toFixed(2);
}

function numOfVariables(code) {
    const matches = code.match(/\b(let|const|var)\s+[a-zA-Z_$][\w$]*/g);
    return matches ? matches.length : 0;
}

function numOfFunctions(code) {
    const normal = code.match(/\bfunction\s+[a-zA-Z_$][\w$]*/g) || [];
    const arrow = code.match(/\bconst\s+[a-zA-Z_$][\w$]*\s*=\s*\([^)]*\)\s*=>/g) || [];
    return normal.length + arrow.length;
}

function numOfLoops(code) {
    const matches = code.match(/\b(for|while|do)\b/g);
    return matches ? matches.length : 0;
}

function averageLengthOfNames(code) {
    const names = [];
    const vars = code.match(/\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g) || [];
    vars.forEach(v => names.push(v.split(/\s+/)[1]));
    const funcs = code.match(/\bfunction\s+([a-zA-Z_$][\w$]*)/g) || [];
    funcs.forEach(f => names.push(f.split(" ")[1]));
    if (names.length === 0) return 0;
    const sum = names.reduce((acc, n) => acc + n.length, 0);
    return (sum / names.length).toFixed(2);
}

function numOfRepeats(code) {
    const lines = code
        .split(/\r\n|\r|\n/)
        .map(l => l.trim())
        .filter(l => l !== "" && l !== "{" && l !== "}");
    const map = {};
    let repeats = 0;
    for (let line of lines) {
        map[line] = (map[line] || 0) + 1;
    }
    for (let key in map) {
        if (map[key] > 1) repeats++;
    }
    return repeats;
}

function output(code) {
    return `Довжина: ${numOfLines(code)}
Глибина вкладеності: ${getDepth(parseStatements(code))}
Зрозумілість: ${clarity(code)}
Кількість змінних: ${numOfVariables(code)}
Кількість функцій: ${numOfFunctions(code)}
Кількість циклів: ${numOfLoops(code)}
Середня довжина імен функцій та змінних: ${averageLengthOfNames(code)}
Кількість повторів коду: ${numOfRepeats(code)}`;
}

const code = `// small comment
/*very
big
comment*/

function dddd(a) {
    if (a) {
        if (b) {
            if (c) let num = 5;
        }
    }
}`;

console.log(output(cut(code)));