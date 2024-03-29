module.exports = {
  // Specify the line length that the printer will wrap on.
  printWidth: 120,

  // Specify the number of spaces per indentation-level.
  tabWidth: 2,

  // Indent lines with tabs instead of spaces.
  useTabs: false,

  // Print semicolons at the ends of statements.
  semi: false,

  // Use single quotes instead of double quotes.
  singleQuote: true,

  // Change when properties in objects are quoted.
  quoteProps: 'as-needed',

  // Print trailing commas wherever possible when multi-line.
  trailingComma: 'all',

  // Print spaces between brackets in object literals.
  bracketSpacing: true,

  // Put the > of a multi-line JSX element at the end of the last line instead of being alone on the next line.
  jsxBracketSameLine: false, // This is deprecated in version 2.4 and replaced by bracketSameLine

  // Include parentheses around a sole arrow function parameter.
  arrowParens: 'always',

  // Specify which parser to use.
  parser: 'typescript',

  // Specify the end of line used by Prettier.
  endOfLine: 'lf',
};