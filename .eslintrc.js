module.exports = {
  "extends": "airbnb",
  "env": {
    "browser": true,
  },
  "rules": {
    "comma-dangle": ["error", {
      "functions": "ignore",
      "arrays": "only-multiline",
      "objects": "only-multiline",
    }],
  },
};
