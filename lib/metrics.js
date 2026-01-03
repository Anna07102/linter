const { parseWithAcorn, getDepthFromAST } = require('./parser');
const { cut, numOfLines } = require('./utils');
const walk = require('acorn-walk');

function clarity(code) {
    const lines = numOfLines(code);
    if (lines === 0) return 0;
    const cleaned = cut(code);
    const ast = parseWithAcorn(cleaned);
    const d = getDepthFromAST(ast, cleaned);
    const loops = numOfLoops(code);
    const avgName = averageLengthOfNames(code);
    const score =
        (1 / (d + 1)) * 0.3 +
        (1 / (loops + 1)) * 0.4 +
        (avgName / 10) * 0.3;
    return score.toFixed(2);
}

function numOfVariables(code) {
    const ast = parseWithAcorn(code);
    if (!ast) {
        const matches = code.match(/\b(let|const|var)\s+[a-zA-Z_$][\w$]*/g);
        return matches ? matches.length : 0;
    }
    let count = 0;
    walk.simple(ast, {
        VariableDeclaration(node) {
            count += node.declarations.length;
        }
    });
    return count;
}

function numOfFunctions(code) {
    const ast = parseWithAcorn(code);
    if (!ast) {
        const normal = (code.match(/\bfunction\s+[a-zA-Z_$][\w$]*/g) || []).length;
        const arrow = (code.match(/\b[a-zA-Z_$][\w$]*\s*=\s*\([^)]*\)\s*=>/g) || []).length;
        return normal + arrow;
    }
    let count = 0;
    walk.simple(ast, {
        FunctionDeclaration(node) {
            count++;
        },
        FunctionExpression(node) {
            count++;
        },
        ArrowFunctionExpression(node) {
            count++;
        }
    });
    return count;
}

function numOfLoops(code) {
    const ast = parseWithAcorn(code);
    if (!ast) {
        const matches = code.match(/\b(for|while|do)\b/g);
        return matches ? matches.length : 0;
    }
    let count = 0;
    walk.simple(ast, {
        ForStatement() { count++; },
        WhileStatement() { count++; },
        DoWhileStatement() { count++; }
    });
    return count;
}

function averageLengthOfNames(code) {
    const ast = parseWithAcorn(code);
    if (!ast) {
        const names = [];
        const vars = code.match(/\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g) || [];
        vars.forEach(v => names.push(v.split(/\s+/)[1]));
        const funcs = code.match(/\bfunction\s+([a-zA-Z_$][\w$]*)/g) || [];
        funcs.forEach(f => names.push(f.split(/\s+/)[1]));
        if (names.length === 0) return 0;
        const sum = names.reduce((acc, n) => acc + n.length, 0);
        return (sum / names.length).toFixed(2);
    }
    const names = [];
    walk.simple(ast, {
        VariableDeclarator(node) {
            if (node.id && node.id.name) names.push(node.id.name);
        },
        FunctionDeclaration(node) {
            if (node.id && node.id.name) names.push(node.id.name);
        }
    });
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
    const cleaned = cut(code);
    const ast = parseWithAcorn(cleaned);
    return `Довжина: ${numOfLines(code)}\nГлибина вкладеності: ${getDepthFromAST(ast, cleaned)}\nЗрозумілість: ${clarity(code)}\nКількість змінних: ${numOfVariables(code)}\nКількість функцій: ${numOfFunctions(code)}\nКількість циклів: ${numOfLoops(code)}\nСередня довжина імен функцій та змінних: ${averageLengthOfNames(code)}\nКількість повторів коду: ${numOfRepeats(code)}`;
}

module.exports = {
    output
};

