import parseColor from 'parse-color';
import shp from 'shpjs';
import moment from 'moment';
import { parseDuration } from 'eoxc/src/contrib/OpenLayers/utils';
import { setSearchParam } from 'eoxc/src/core/util'

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

export function updateConfigBySearchParams(config) {
  if (config.disableSearchParams) {
    return config;
  }
  // extracts search parameters in url and update settings replacing keys with user supported ones
  const configUpdate = Object.assign({}, config);
  const params = new URLSearchParams(window.location.search);
  // validate and set time filter
  const timeStartStr = params.get('timestart') || params.get('time_start');
  const timeEndStr = params.get('timeend') || params.get('time_end');
  if (typeof timeStartStr === 'string' && typeof timeEndStr === 'string') {
    const timestart = moment.utc(timeStartStr).toDate();
    let timeend = moment.utc(timeEndStr).toDate();
    // validate start with timeDomain
    if (timestart >= moment.utc(config.timeDomain[0]).toDate() && timestart <= moment.utc(config.timeDomain[1]).toDate()) {
      configUpdate.selectedTimeDomain[0] = timestart;
      // validate timeend vs timestart
      if ((timeend - timestart) === 0 || timeend < timestart) {
        timeend = moment.utc(timestart).add(1, 'days');
      }
      // end needs more validation
      const selectableInterval = parseDuration(config.selectableInterval);
      if (selectableInterval !== null) {
        if (timeend - timestart > (selectableInterval * 1000)) {
          // shorten interval to selectableInterval
          timeend = moment.utc(timestart).add(selectableInterval, 'seconds').toDate();
        }
      }
      if (timeend > moment.utc(config.timeDomain[1]).toDate()) {
        timeend = moment.utc(config.timeDomain[1]).toDate();
      }
      configUpdate.selectedTimeDomain[1] = timeend;
      // modify display time to show 1.1 * larger area on timeSlider to make dragging easier
      const timeDiff = timeend - timestart;
      const displayTimeStart = moment.utc(timestart).subtract(timeDiff * 0.05, 'milliseconds').toDate();
      const displayTimeEnd = moment.utc(timeend).add(timeDiff * 0.05, 'milliseconds').toDate();
      configUpdate.displayTimeDomain = [displayTimeStart, displayTimeEnd];
    }
  }
  // set map position
  const xStr = params.get('x');
  const yStr = params.get('y');
  if (typeof xStr === 'string' && typeof yStr === 'string') {
    const x = parseFloat(xStr.replace(',', '.'));
    const y = parseFloat(yStr.replace(',', '.'));
    if (!isNaN(x) && !isNaN(y)) {
      // TODO: validate if actually fits into CRS bounds if necessary
      configUpdate.center = [x, y];
    }
  }
  // set map zoom
  const zStr = params.get('z');
  if (typeof xStr === 'string' && typeof yStr === 'string') {
    const z = parseInt(zStr.replace(',', '.'), 10);
    if (!isNaN(z)) {
      // not checking maxzoom or minzoom on layers/main config, it is validated by OL anyway
      configUpdate.zoom = z - 1;
    }
  }
  return configUpdate;
}

export function updateFiltersBySearchParams(layerCollection) {
  // for single layer mode, update values of search filters from url search params
  const params = new URLSearchParams(window.location.search);
  const configuredFilters = layerCollection[0].get('search.parameters') || [];
  configuredFilters.forEach((filter, i) => {
    const searchParam = params.get(filter.type);
    // unable to overwrite fixed parameters
    if (searchParam !== null && !filter.fixed) {
      // validate if allowed
      if (filter.options) {
        filter.options.forEach((opt) => {
          if (opt.value === searchParam) {
            layerCollection[0].get('search.parameters')[i].default = searchParam;
          }
        });
      } else if (filter.range) {
        // compare to config min/max, validate numerical
        const minmax = searchParam.replace('(').replace(')').split(',')
          .map(num => parseInt(num, 10))
          .filter(isnum => !isNaN(isnum));
        if (minmax.length === 1) {
          // assume user input just maxnumber
          const max = minmax[0] <= filter.max ? minmax[0] : filter.max;
          layerCollection[0].get('search.parameters')[i].default = {
            min: filter.min,
            max,
          };
        } else if (minmax.length === 2) {
          // normal case when user sets start,end
          const min = minmax[0] >= filter.min ? minmax[0] : filter.min;
          const max = minmax[1] <= filter.max ? minmax[1] : filter.max;
          layerCollection[0].get('search.parameters')[i].default = {
            min,
            max,
          };
        }
      } else {
        layerCollection[0].get('search.parameters')[i].default = searchParam;
      }
    }
  });
}

export function setSearchParamsFilterChange(filtersModel) {
  // for each key in changed, update params
  const changed = filtersModel.changed;
  Object.entries(changed).forEach(([key, value]) => {
    if (typeof value === 'object') {
      // range min/max filters special encoding as filter=a,b
      if (Object.keys(value).includes('min') && Object.keys(value).includes('max')) {
        const rangeValue = `${value.min},${value.max}`;
        setSearchParam(key, rangeValue);
      }
    } else {
      setSearchParam(key, value);
    }
  });
}
