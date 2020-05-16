module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:promise/recommended"
  ],
  parserOptions: {
    "project": "./tsconfig.json",
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  rules: {
    // Bolt defines properties with snake case; turn it off
    "@typescript-eslint/camelcase": ["off"],
    "quotes": "off",
    "@typescript-eslint/quotes": ["error", "single"],
    "semi": "off",
    "@typescript-eslint/semi": ["error", "always"],
  }
}
