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

export { getImg };
