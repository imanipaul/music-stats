/** Default star / empty artwork asset returned by Last.fm for many API image fields. */
const LFM_PLACEHOLDER_IMAGE_ID = "2a96cbd8b46e442fc41c2b86b821562f";

function isPlaceholderLastFmImage(url) {
  if (!url) return true;
  return url.includes(LFM_PLACEHOLDER_IMAGE_ID);
}

function getImg(images, size, name) {
  console.group("getImg", name);
  console.log("images", images);
  if (!images) return "";
  const found =
    images.find((i) => i.size === size) || images[images.length - 1];
  console.log("found", found);
  console.groupEnd();
  return found ? found["#text"] : "";
}

export { getImg, isPlaceholderLastFmImage };
