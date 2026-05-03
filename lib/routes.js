/** Next.js dynamic segment — encode once for safe URLs. */
export function artistPath(name) {
  return `/artist/${encodeURIComponent(name)}`;
}

export function albumPath(artistName, albumName) {
  return `/album/${encodeURIComponent(artistName)}/${encodeURIComponent(albumName)}`;
}
