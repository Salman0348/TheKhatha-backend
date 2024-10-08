/**
 * function to extract public ID from the cloudinary URL
 * @param {string} url - cloudinary url of string type
 */
const extractPublicId = (url) => {
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  const publicId = lastPart.substring(0, lastPart.lastIndexOf(".")); //extracts the public id on the basis of last dot indepentdent from the other parts of the url
  return publicId;
};

module.exports = extractPublicId;
