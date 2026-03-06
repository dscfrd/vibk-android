export function stripAnsi(text: string): string {
  return text
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '')
    .replace(/\x1b[()][AB012]/g, '')
    .replace(/\x1b[>=<]/g, '')
    .replace(/\x1b\[[\?]?[0-9;]*[hlm]/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
}
