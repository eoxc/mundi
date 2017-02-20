import parseColor from 'parse-color';

export function readFileAsArraybuffer(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = () => {
      reject(fileReader.error);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

export function premultiplyColor(colorDef) {
  const rgba = parseColor(colorDef).rgba;
  const a = rgba ? rgba[3] : undefined;
  if (typeof rgba[3] !== 'undefined' && rgba[3] !== 1) {
    let [r, g, b] = rgba;
    r = Math.min(255, r + (255 * (1 - a)));
    g = Math.min(255, g + (255 * (1 - a)));
    b = Math.min(255, b + (255 * (1 - a)));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return colorDef;
}
