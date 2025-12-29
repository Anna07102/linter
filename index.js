const acorn = require('acorn');
const walk = require('acorn-walk');

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

function parseWithAcorn(code) {
    try {
        return acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch (err) {
        // Попытка исправления: обернуть одиночные декларации после if в блоки
        const fixed = code.replace(/if\s*(\([^)]*\))\s*(let|const|var)\s*([^;]+;)/g, 'if $1 { $2 $3 }');
        try {
            return acorn.parse(fixed, { ecmaVersion: 'latest', sourceType: 'module' });
        } catch (err2) {
            // Если не удалось распарсить, возвращаем null и позволяем функциям-обходам использовать эвристики
            console.warn('Acorn parse failed, falling back to heuristics:', err2.message);
            return null;
        }
    }
}

function getDepthFromAST(ast, codeFallback = '') {
    if (!ast) {
        // Простой эвристический подсчёт глубины: считаем вложенные if/for/while по фигурным скобкам
        const tokens = (codeFallback || '').match(/if\s*\([^)]*\)|\{|\}|[^\s{};]+/g) || [];
        let max = 0;
        let depth = 0;
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t === '{') {
                depth++;
                if (depth > max) max = depth;
            } else if (t === '}') {
                depth = Math.max(0, depth - 1);
            }
        }
        return max;
    }

    let maxDepth = 0;
    const incTypes = new Set([
        'IfStatement',
        'ForStatement',
        'WhileStatement',
        'DoWhileStatement',
        'SwitchStatement',
        'FunctionDeclaration',
        'FunctionExpression',
        'ArrowFunctionExpression',
        'BlockStatement',
        'TryStatement',
        'CatchClause'
    ]);

    walk.ancestor(ast, {
        IfStatement(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        },
        ForStatement(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        },
        WhileStatement(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        },
        DoWhileStatement(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        },
        SwitchStatement(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        },
        FunctionDeclaration(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        },
        ArrowFunctionExpression(node, ancestors) {
            const depth = ancestors.filter(a => incTypes.has(a.type)).length;
            if (depth > maxDepth) maxDepth = depth;
        }
    });

    return maxDepth;
}

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

// Обновлённые функции с защитой на случай, если AST == null
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