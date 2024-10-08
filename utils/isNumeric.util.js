function isNumeric(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

module.exports = isNumeric;
