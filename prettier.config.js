/** @type {import('prettier').Config} */
const config = {
  // Base configuration
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',
  arrowParens: 'avoid',
  bracketSpacing: true,
  bracketSameLine: false,
  quoteProps: 'as-needed',
  singleAttributePerLine: false,
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  
  // File type specific overrides
  overrides: [
    {
      files: ['**/*.html'],
      options: {
        parser: 'angular',
        printWidth: 120,
        singleAttributePerLine: true,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      files: ['**/*.ts', '**/*.js'],
      options: {
        parser: 'typescript',
        printWidth: 80,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    {
      files: ['**/*.json'],
      options: {
        parser: 'json',
        printWidth: 80,
        tabWidth: 2,
        trailingComma: 'none',
      },
    },
    {
      files: ['**/*.md'],
      options: {
        parser: 'markdown',
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: ['**/*.yaml', '**/*.yml'],
      options: {
        parser: 'yaml',
        printWidth: 80,
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: ['**/*.scss', '**/*.css'],
      options: {
        parser: 'scss',
        printWidth: 80,
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: ['**/*.xml'],
      options: {
        parser: 'xml',
        printWidth: 120,
        xmlWhitespaceSensitivity: 'ignore',
      },
    },
  ],
};

module.exports = config;