# defi-dapp

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```
打包前需确认：
  ./src/api/contract.js 中各合约地址
  ./src/store/index.js 中 rewardDeadline 奖励截止日期

测试服打包，需确认 .env.staging 中的配置
```
yarn build:staging
```
正式服打包，需确认 .env.production 中的配置
```
yarn build:production
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
