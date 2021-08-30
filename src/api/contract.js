const isPro = process.env.VUE_APP_SERVER_ID === '1'; // 是否正式服

export const defaultLanguage = 'en-US'; // 'en-US', 'zh-CN'
export const releaseTag = '2106242125';

export const cookieDomain = isPro ? 'rosefin.tech' : 'inflex.top';

export const web3Url = isPro
  ? 'https://etherscan.io'
  : 'https://etherscan.io';

export const assetManagementAddress = ''

export const tsrAddress = isPro
  ? '0x58959e0c71080434f237bd42d07cd84b74cef438' // 正式
  : '0x58959e0c71080434f237bd42d07cd84b74cef438'; // 测试服使用

export const disposeAddress = isPro
  ? '0x5c86B8A9ac78D27c98096CCa6F437fdd4748596E' // FIXME:需要更改
  : '0x5c86B8A9ac78D27c98096CCa6F437fdd4748596E'; // 测试服使用
