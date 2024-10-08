function isSubset(arr1, arr2) {
  return arr1.every((element) => arr2.includes(element));
}

const hasDuplicates = (arr) => {
  return new Set(arr).size !== arr.length;
};

module.exports = { isSubset, hasDuplicates };
