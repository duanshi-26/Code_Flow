import React, { useState } from 'react';

// Safe expression evaluation function
const safeEval = (expr, scope) => {
  // eslint-disable-next-line no-new-func
  const func = new Function(...Object.keys(scope), `return ${expr}`);
  return func(...Object.values(scope));
};

// Improved Java code execution function
const executeJavaCode = (code, input = []) => {
  let globalVariables = {};
  let output = [];
  let steps = [];
  let inputIndex = 0;
  let functions = {};
  let callStack = [];

  const lines = code.split('\n').map(line => line.trim()).filter(line => line !== '');

  const addStep = (line, variables, output) => {
    steps.push({ line, variables: { ...variables }, output: [...output], callStack: [...callStack] });
  };

  const evalExpression = (expr, scope) => {
    const combinedScope = { ...globalVariables, ...scope };
    for (const [name, value] of Object.entries(combinedScope)) {
      expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), JSON.stringify(value));
    }
    return safeEval(expr, combinedScope);
  };

  const executeFunctionCall = (funcName, args, scope) => {
    const func = functions[funcName];
    if (!func) throw new Error(`Function ${funcName} is not defined`);

    const localScope = { ...scope };
    func.params.forEach((param, index) => {
      localScope[param] = evalExpression(args[index], scope);
    });

    callStack.push(funcName);
    const result = executeBlock(func.body, localScope);
    callStack.pop();

    return result;
  };

  const executeBlock = (block, scope) => {
    let blockScope = { ...scope };
    let returnValue;

    for (let i = 0; i < block.length; i++) {
      const line = block[i];

      if (line.startsWith('return')) {
        returnValue = evalExpression(line.split('return')[1].trim().replace(';', ''), blockScope);
        break;
      }

      executeLine(line, blockScope);

      if (returnValue !== undefined) break;
    }

    return returnValue;
  };

  const executeLine = (line, scope) => {
    if (line.startsWith('//') || /^(public class|public static void main)/.test(line)) {
      return;
    }

    if (/^(int|double|String)\s+\w+(\s*=\s*.+)?;$/.test(line)) {
      const [type, rest] = line.split(/\s+(.+)/);
      let [name, value] = rest.split('=').map(s => s.trim());
      name = name.replace(';', '');
      if (value) {
        scope[name] = evalExpression(value.replace(';', ''), scope);
      } else {
        scope[name] = type === 'String' ? '' : 0;
      }
    } else if (/^\w+\s*=\s*.+;$/.test(line)) {
      const [name, value] = line.split('=').map(s => s.trim());
      scope[name] = evalExpression(value.replace(';', ''), scope);
    } else if (/System\.out\.print(ln)?/.test(line)) {
      const content = line.match(/print(ln)?\((.*)\)/)[2];
      output.push(evalExpression(content, scope));
    } else if (line.startsWith('if')) {
      const condition = line.match(/if\s*\((.*)\)/)[1];
      if (evalExpression(condition, scope)) {
        // Execute the next line if condition is true
        const nextLineIndex = lines.indexOf(line) + 1;
        if (nextLineIndex < lines.length) {
          executeLine(lines[nextLineIndex], scope);
        }
      }
    } else if (/Scanner/.test(line)) {
      const varName = line.split('=')[0].trim();
      const inputValue = input[inputIndex++] || '';
      scope[varName] = inputValue;
    } else if (/^(\w+)\s*\((.*)\);?$/.test(line)) {
      const [, funcName, args] = line.match(/^(\w+)\s*\((.*)\);?$/);
      executeFunctionCall(funcName, args.split(',').map(arg => arg.trim()), scope);
    }

    addStep(line, { ...globalVariables, ...scope }, output);
  };

  // First pass: collect function definitions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(public static )?\w+\s+\w+\s*\((.*)\)\s*\{/.test(line)) {
      const [, returnType, name, params] = line.match(/^(?:public static )?(\w+)\s+(\w+)\s*\((.*)\)\s*\{/);
      const body = [];
      let braceCount = 1;
      while (braceCount > 0 && i < lines.length - 1) {
        i++;
        if (lines[i].includes('{')) braceCount++;
        if (lines[i].includes('}')) braceCount--;
        if (braceCount > 0) body.push(lines[i]);
      }
      functions[name] = { returnType, params: params.split(',').map(p => p.trim().split(' ')[1]), body };
    }
  }

  // Second pass: execute the code
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('public static') && !line.includes('class')) {
      executeLine(line, globalVariables);
    }
  }

  return steps;
};

const JavaCodeVisualizer = () => {
  const [code, setCode] = useState('// Enter your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        int x = 5;\n        int y = 10;\n        System.out.println(x + y);\n    }\n}');
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  const runCode = () => {
    try {
      const result = executeJavaCode(code, input.split('\n'));
      setSteps(result);
      setCurrentStep(0);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const stepForward = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const stepBackward = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const reset = () => {
    setSteps([]);
    setCurrentStep(0);
    setError(null);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '64rem', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Java Code Visualizer</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your Java code here..."
          style={{ width: '100%', height: '16rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input values here (one per line)..."
          style={{ width: '100%', height: '16rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={runCode} style={{ padding: '0.5rem 1rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Run Code</button>
        <div>
          <button onClick={stepBackward} disabled={currentStep === 0} style={{ padding: '0.5rem 1rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', marginRight: '0.5rem' }}>Step Back</button>
          <button onClick={stepForward} disabled={currentStep === steps.length - 1} style={{ padding: '0.5rem 1rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', marginRight: '0.5rem' }}>Step Forward</button>
          <button onClick={reset} style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Reset</button>
        </div>
      </div>
      {error && (
        <div style={{ backgroundColor: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '0.25rem', padding: '1rem', marginBottom: '1rem', color: '#B71C1C' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: '0.25rem', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Variables</h2>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '0.25rem' }}>
            {JSON.stringify(steps[currentStep]?.variables, null, 2)}
          </pre>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '0.25rem', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Output</h2>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '0.25rem' }}>
            {steps[currentStep]?.output.join('\n')}
          </pre>
        </div>
      </div>
      <div style={{ border: '1px solid #ccc', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Current Line</h2>
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '0.25rem' }}>
          {steps[currentStep]?.line}
        </pre>
      </div>
    </div>
  );
};

export default JavaCodeVisualizer;