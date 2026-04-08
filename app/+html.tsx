import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

/** 씬 클리어(#140e0b)와 맞춰 하단에 얇은 띠가 있어도 덜 튐 */
const responsiveBackground = `
html {
  height: 100%;
  margin: 0;
}
body {
  margin: 0;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  background-color: #fff;
}
/* RN Web / Expo: body 직하 div가 flex 높이를 못 타면 캔버스 아래에 빈 띠가 생김 */
body > div {
  min-height: 100%;
  min-height: 100dvh;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #140e0b;
  }
}
`;
