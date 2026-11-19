export const CATEGORIES = {
  arithmetic: {
    label: "Arithmetic",
    operators: ["+", "-", "*", "/", "//", "%", "**"],
    description: "Arithmetic symbols used in flowchart process blocks: +, -, *, /, //, %, **. Use everyday totals, sharing, groups and remainders."
  },
  comparison: {
    label: "Comparisons in decision diamonds",
    operators: [">", "<", ">=", "<=", "==", "!="],
    description: "Comparison symbols >, <, >=, <=, ==, != help a flowchart decision diamond choose a Yes or No path. Use familiar values and clear outcomes."
  },
  logical: {
    label: "Combining flowchart conditions",
    operators: ["AND", "OR", "NOT"],
    description: "AND, OR and NOT combine Yes or No conditions in a flowchart. Use simple everyday situations and show which path is followed."
  },
  assignment: {
    label: "Values in process blocks",
    operators: ["=", "+=", "-=", "*=", "/=", "//=", "%=", "**="],
    description: "These symbols show how a process block stores or changes a number in a named box. Explain the starting number and the updated number using plain language."
  },
  ternary: {
    label: "Decision branches",
    operators: ["if/else"],
    description: "A decision diamond sends a flowchart along one path when a condition is Yes and another when it is No. Use a familiar situation and describe the resulting path."
  }
};
