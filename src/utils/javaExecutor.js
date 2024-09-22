export function executeJavaCode(code) {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line !== '');
    let variables = {};
    let output = [];
    let executionSteps = [];
    let scannerInput = [];
  
    function addExecutionStep() {
      executionSteps.push({
        variables: { ...variables },
        output: [...output]
      });
    }
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('import') || line.startsWith('public class') || line.startsWith('public static void main')) {
        // Ignore import statements, class declaration, and main method declaration
        continue;
      }
  
      if (line.startsWith('//') || line.trim() === '{' || line.trim() === '}') {
        // Ignore comments and brackets
        continue;
      }
  
      if (line.match(/^(int|double|String)\s+\w+(\s*=\s*.+)?;$/)) {
        // Variable declaration and optional initialization
        const [type, declaration] = line.split(/\s+(.+)/);
        let [name, value] = declaration.split('=').map(part => part.trim());
        name = name.replace(';', '');
        if (value) {
          value = value.replace(';', '');
          variables[name] = evalExpression(value, variables, type);
        } else {
          variables[name] = getDefaultValue(type);
        }
      } else if (line.match(/^\w+\s*=\s*.+;$/)) {
        // Variable assignment
        const [name, value] = line.split('=').map(part => part.trim());
        if (!(name in variables)) {
          throw new Error(`Variable ${name} is not declared (line ${i + 1})`);
        }
        variables[name] = evalExpression(value.replace(';', ''), variables);
      } else if (line.startsWith('System.out.println') || line.startsWith('System.out.print')) {
        // Print statement
        const printContent = line.match(/print(?:ln)?\((.*)\)/)[1];
        const result = evalExpression(printContent, variables);
        output.push(`${result}`);
      } else if (line.startsWith('if')) {
        // Basic if statement
        const condition = line.match(/if\s*\((.*)\)/)[1];
        if (evalExpression(condition, variables)) {
          // Execute the next line if condition is true
          i++;
          const nextLine = lines[i];
          if (nextLine.match(/^\w+\s*=\s*.+;$/)) {
            const [name, value] = nextLine.split('=').map(part => part.trim());
            variables[name] = evalExpression(value.replace(';', ''), variables);
          } else if (nextLine.startsWith('System.out.println') || nextLine.startsWith('System.out.print')) {
            const printContent = nextLine.match(/print(?:ln)?\((.*)\)/)[1];
            const result = evalExpression(printContent, variables);
            output.push(`${result}`);
          }
        }
      } else if (line.includes('new Scanner(System.in)')) {
        // Scanner initialization (ignore it)
        continue;
      } else if (line.includes('.nextInt()') || line.includes('.nextDouble()') || line.includes('.nextLine()')) {
        // Simulating Scanner input
        const varName = line.split('=')[0].trim();
        const inputType = line.includes('.nextInt()') ? 'int' : line.includes('.nextDouble()') ? 'double' : 'String';
        const inputValue = scannerInput.shift() || getDefaultValue(inputType);
        variables[varName] = inputValue;
      } else {
        throw new Error(`Unsupported statement: ${line} (line ${i + 1})`);
      }
  
      addExecutionStep();
    }
  
    return executionSteps;
  }
  
  function evalExpression(expr, variables, type = null) {
    // Replace variable names with their values
    for (const [name, value] of Object.entries(variables)) {
      expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), JSON.stringify(value));
    }
  
    // Evaluate the expression
    let result;
    try {
      result = eval(expr);
    } catch (error) {
      throw new Error(`Invalid expression: ${expr}`);
    }
  
    // Type checking and conversion
    if (type === 'int') {
      result = Math.floor(Number(result));
    } else if (type === 'double') {
      result = parseFloat(result);
    } else if (type === 'String') {
      result = String(result);
    }
  
    return result;
  }
  
  function getDefaultValue(type) {
    switch (type) {
      case 'int':
      case 'double':
        return 0;
      case 'String':
        return "";
      default:
        return null;
    }
  }