import i18next from 'i18next';

export default function (key, count = undefined) {
  if (typeof count === 'number') {
    return i18next.t(key, { count });
  }
  return i18next.t(key);
}
