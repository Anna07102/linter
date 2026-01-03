const acorn = require('acorn');
const walk = require('acorn-walk');

function parseWithAcorn(code) {
    try {
        return acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    } catch (err) {
        try {
            // Попытка исправления: обернуть одиночные декларации после if в блоки
            const fixed = code.replace(
                /if\s*(\([^)]*\))\s*(let|const|var)\s*([^;]+;)/g,
                'if $1 { $2 $3 }'
            );
            return acorn.parse(fixed, { ecmaVersion: 'latest', sourceType: 'module' });
        } catch (err2) {
            console.warn('Acorn parse failed, falling back to heuristics:', err2.message);
            return null;
        }
    }
}

function getDepthFromAST(ast, codeFallback = '') {
    const incTypes = new Set([
        'TryStatement',
        'CatchClause',
        'ArrowFunctionExpression',
        'FunctionExpression',
        'FunctionDeclaration',
        'SwitchStatement',
        'DoWhileStatement',
        'WhileStatement',
        'ForStatement',
        'IfStatement',
    ]);

    let maxDepth = 0;

    if (ast) {
        walk.ancestor(ast, {
            ArrowFunctionExpression(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
            FunctionDeclaration(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
            SwitchStatement(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
            DoWhileStatement(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
            WhileStatement(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
            ForStatement(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
            IfStatement(node, ancestors) {
                const depth = ancestors.filter(a => incTypes.has(a.type)).length;
                if (depth > maxDepth) maxDepth = depth;
            },
        });
        return maxDepth;
    }

    const tokens = (codeFallback || '').match(/if\s*\([^)]*\)|\{|\}|[^\s{};]+/g) || [];
    let depth = 0;
    let max = 0;
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

module.exports = { parseWithAcorn, getDepthFromAST };
