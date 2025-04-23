module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    // Remove 'prettier --write'
  ],
  '*.{json,md,yml,yaml}': [
    // Remove 'prettier --write'
  ],
  '*.{css,scss}': [
    // Remove 'prettier --write'
  ],
};

