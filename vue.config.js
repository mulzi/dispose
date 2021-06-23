const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  devServer: {
    open: false, // 是否自动打开浏览器页面
    host: '0.0.0.0',    // 指定使用一个 host，默认是 localhost
    // port: 8080, // 端口地址
    https: false, // 使用https提供服务
    // 设置代理，此处应该配置为开发服务器的后台地址(更改地址设置测试服和正式服切换)
    proxy: {
      '/api': {
        // target: 'http://192.168.1.162:8091', // 源地址 钉航
        // target: 'http://172.28.143.71:8091', // 源地址 钉航
        // target: 'http://113.204.194.86:9997', // 测试服源地址
        target: 'http://113.204.194.91:9997', // 测试服源地址
        changeOrigin: true, // 改变源
        pathRewrite: {
          '^/api': '', // 路径重写
        },
      },
      '/ast': {
        target: 'https://api.icad.pro:4432', // 交易系统 潇哥
        changeOrigin: true, // 改变源
        pathRewrite: {
          '^/ast': '', // 路径重写
        },
      },
      '/first': {
        target: 'https://api.icad.pro:4430', // 一期（后台系统）
        changeOrigin: true, // 改变源
        pathRewrite: {
          '^/first': '', // 路径重写
        },
      },
    },
  },
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // 引入terser-webpack-plugin，注意版本控制在@4.2.3 以前
      config.optimization.minimizer = [(
        new TerserPlugin({ 
          extractComments: false,
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
          terserOptions: { compress: { drop_console: true } }, // 去掉console.log
          parallel: true, // 使用多线程并发运行
        })
      )]

      // 打包切片
      config.optimization.splitChunks = {
        // minSize: 60000,
        // maxSize: 600000,
        chunks: 'all', // 和默认没什么变, 没有上边设置的有效；但在网络不好的情况时，会文件加载不一，而排版错乱的情况。
      }
    }
  },
  css: {
    loaderOptions: {
      postcss: {
        plugins: [
          // postcss-pxtorem
          require('postcss-pxtorem')({
            rootValue: 75,
            // propList: ['*', '!font-size'],
            propList: ['*'],
            exclude: /node_modules|folder_name/i,
          }),
        ]
      },
    },
  },
  productionSourceMap: process.env.NODE_ENV !== 'production',
}