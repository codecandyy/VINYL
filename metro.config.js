const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/**
 * Web: Metro가 zustand의 `import` export로 `esm/*.mjs`를 고르면
 * `middleware.mjs` 안의 `import.meta`가 번들에 남아
 * "Cannot use 'import.meta' outside a module" 가 난다.
 * (@react-three/drei 등이 `zustand/middleware`를 씀)
 *
 * 서브패스는 항상 패키지 루트의 CommonJS `*.js`로 고정한다.
 */
module.exports = (() => {
  const projectRoot = __dirname;
  const config = getDefaultConfig(projectRoot);

  // Web에서도 `react-native` export 조건을 먼저 본다 → zustand 등이 CJS(.js)를 쓰고
  // `esm/*.mjs`의 import.meta 가 번들에 남는 것을 막는다.
  const prev = config.resolver.unstable_conditionsByPlatform ?? {};
  config.resolver.unstable_conditionsByPlatform = {
    ...prev,
    web: ['react-native', ...(prev.web ?? ['browser'])].filter(
      (c, i, a) => a.indexOf(c) === i
    ),
  };

  const upstreamResolveRequest = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName.startsWith('zustand/')) {
      const sub = moduleName.replace(/^zustand\//, '');
      if (sub && sub !== 'package.json') {
        const cjsPath = path.join(projectRoot, 'node_modules', 'zustand', `${sub}.js`);
        if (fs.existsSync(cjsPath)) {
          return { filePath: cjsPath, type: 'sourceFile' };
        }
      }
    }
    if (typeof upstreamResolveRequest === 'function') {
      return upstreamResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };

  return config;
})();
