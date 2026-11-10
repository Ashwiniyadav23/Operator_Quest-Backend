export const CATEGORIES = {
  arithmetic: {
    label: "Arithmetic",
    operators: ["+", "-", "*", "/", "//", "%", "**"],
    description: "Arithmetic operators: +, -, *, /, //, %, **. Test precedence, brackets, division and remainders."
  },
  comparison: {
    label: "Comparison",
    operators: [">", "<", ">=", "<=", "==", "!="],
    description: "Comparison operators: >, <, >=, <=, ==, !=. Questions must test true/false outcomes and choosing the correct comparison."
  },
  logical: {
    label: "Logical",
    operators: ["AND", "OR", "NOT"],
    description: "Logical operators: AND, OR, NOT (Python-style words). Include truth tables, combined conditions and everyday situations."
  },
  assignment: {
    label: "Assignment",
    operators: ["=", "+=", "-=", "*=", "/=", "//=", "%=", "**="],
    description: "Assignment operators: =, +=, -=, *=, /=, //=, %=, **=. Give an initial variable value and ask for its value after the operation."
  },
  ternary: {
    label: "Ternary",
    operators: ["if/else"],
    description: "Python conditional expression: value_if_true if condition else value_if_false. Ask students to evaluate expressions and choose correct structure."
  }
};
