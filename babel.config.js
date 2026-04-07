module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Metro 웹 번들이 스크립트로 실행될 때 남는 import.meta 제거(치환)
          web: { unstable_transformImportMeta: true },
        },
      ],
    ],
  };
};
