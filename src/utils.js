import parseColor from 'parse-color';
import shp from 'shpjs';

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

export function readAsText(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = () => {
      reject(fileReader.error);
    };
    fileReader.readAsText(file);
  });
}

export function premultiplyColor(colorDef) {
  const rgba = parseColor(colorDef).rgba;
  const a = rgba ? rgba[3] : undefined;
  if (typeof rgba[3] !== 'undefined' && rgba[3] !== 1) {
    let [r, g, b] = rgba;
    r = Math.min(255, r * a + (255 * (1 - a)));
    g = Math.min(255, g * a + (255 * (1 - a)));
    b = Math.min(255, b * a + (255 * (1 - a)));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return colorDef;
}

const dbfMimes = new Set(['application/dbase', 'application/x-dbase', 'application/dbf', 'application/x-dbf']);
const jsonMimes = new Set(['application/json', 'text/json', 'text/x-json']);

export function parseFeaturesFromFiles(fileList) {
  let files;
  if (Array.isArray(fileList)) {
    files = fileList;
  } else {
    files = Array.from(fileList);
  }

  const zipFile = files.find(file => file.type === 'application/zip' || /\.zip$/i.test(file.name));
  const shpFile = files.find(file => /\.shp$/i.test(file.name)); // TODO: no mime?
  const dbfFile = files.find(file => dbfMimes.has(file.type) || /\.dbf$/i.test(file.name));
  const jsonFile = files.find(file => jsonMimes.has(file.type) || /\.json$/i.test(file.name));

  if (zipFile) {
    return readFileAsArraybuffer(zipFile)
      .then(data => shp(data).features);
  } else if (shpFile && dbfFile) {
    return Promise.all([readFileAsArraybuffer(shpFile), readFileAsArraybuffer(dbfFile)])
      .then(([shpBuffer, dbfBuffer]) => shp.combine([
        shp.parseShp(shpBuffer), shp.parseDbf(dbfBuffer)
      ]).features);
  } else if (shpFile) {
    return readFileAsArraybuffer(shpFile)
      .then(shpBuffer => (
        shp.parseShp(shpBuffer).map(geometry => ({ type: 'Feature', properties: {}, geometry }))
      ));
  } else if (jsonFile) {
    return readAsText(jsonFile)
      .then((text) => {
        const content = JSON.parse(text);
        if (content.type === 'Feature') {
          return [content];
        } else if (content.type === 'FeatureCollection') {
          return content.features;
        }
        throw new Error('File content is not valid GeoJSON');
      });
  }
  return Promise.reject(`Could not parse any features from the given file${files.length === 1 ? '' : 's'}.`);
}

export function sizeChangedEvent(handleFunction) {
  // a Jquery plugin function that fires an event when the size of an element is changed
  // usage: $.fn.sizeChanged = sizeChangedEvent;
  // $().sizeChanged(function(){})
  const element = this;
  let lastWidth = element.width();
  let lastHeight = element.height();

  setInterval(() => {
    if (lastWidth === element.width() && lastHeight === element.height()) {
      return;
    }
    if (typeof (handleFunction) === 'function') {
      handleFunction({ width: lastWidth, height: lastHeight },
                   { width: element.width(), height: element.height() });
      lastWidth = element.width();
      lastHeight = element.height();
    }
  }, 200);
  return element;
}
