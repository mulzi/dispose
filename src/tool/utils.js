

export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function getLocalStorage(key, noObject = {}) {
  const lc = localStorage.getItem(key)
  return lc ? JSON.parse(lc) : noObject
}

export function handleForum() {
  window.open('https://discord.gg/pvraxTaS')
}

// 防抖
export function debounce(func, delay = 350) {
  let timer = null
  return function () {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, arguments)
    }, delay)
  }
}

// 节流
export function throttle(func, wait = 350) {
  let start = 0
  return function () {
    let now = Date.now()
    if (now - start >= wait) {
      func.apply(this, arguments)
      start = now
    }
  }
}

export function formatDate(time = Date.now()) {
  const date = new Date(time);
  const padS = (n) => (n < 10 ? `0${n}` : n);
  return `${date.getFullYear()}-${padS(date.getMonth() + 1)}-${padS(date.getDate())}`;
}

export function formatTime(time = Date.now()) {
  const date = new Date(time);
  const padS = (n) => (n < 10 ? `0${n}` : n);
  return `${date.getFullYear()}-${padS(date.getMonth() + 1)}-${padS(date.getDate())}
  ${date.getDate()}:${padS(date.getMinutes())}:${padS(date.getSeconds())}`;
}

/**
 * 计算两点坐标的距离
 * @param {*} pointA 点击位置1
 * @param {*} pointB 点击位置2
 */
export function getDistance(pointA, pointB) {
  return Math.sqrt(
    Math.pow(pointA.clientX - pointB.clientX, 2) + Math.pow(pointA.clientY - pointB.clientY, 2)
  )
}

/**
 * 格式化文件大小, 输出成带单位的字符串
 * @param {Number} size 文件大小
 * @param {Number} [pointLength=2] 精确到的小数点数。
 * @param {Array} [units=[ 'B', 'K', 'M', 'G', 'TB' ]] 单位数组。从字节，到千字节，一直往上指定。
 *    如果单位数组里面只指定了到了K(千字节)，同时文件大小大于M, 此方法的输出将还是显示成多少K.
 */
export function formatSize(size, pointLength, units) {
  let unit;
  units = units || [ 'B', 'K', 'M', 'G', 'TB' ];
  while ((unit = units.shift()) && size > 1024) {
    size = size / 1024;
  }
  return (unit === 'B' ? size : size.toFixed(pointLength === undefined ? 2 : pointLength)) + unit;
}

/**
 * 转换数字为简短形式
 * @param num int 要转换的数字
 * @param precision int 精度
 */
export function shortenNumber(num, precision = 2){
  let out = 0;
  if (num < 1e+3) {
    out = +toFixedFloor(num, precision);
  } else if (num < 1e+6) {
    out = +toFixedFloor(num / 1e+3, precision) + 'k';
  } else if (num < 1e+9) {
    out = +toFixedFloor(num / 1e+6, precision) + 'm';
  } else if (num < 1e+12) {
    out = +toFixedFloor(num / 1e+9, precision) + 'b';
  }

  return out;
}

/**
 * 随机生成十六进制颜色
 */
export function randomHexColor() {
  return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).substr(-6);
}

/**
 * 验证钱包地址
 * @param {String} address 
 */
export function verifyWalletAddress(address) {
  return /[0-9A-z]{42}/i.test(address)
}

/**
 * 验证邮箱
 * @param {String} email 
 */
export function verifyEmail(email) {
  return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/i.test(email)
}

/**
 * 数值格式化显示
 * @param {*} num 
 * @param {*} len 小数位数
 */
export function toFixedFloor(num, len = 2) {
  const n = (+num).toFixed(len + 1)
  return n.slice(0, n.length - 1)
}

export function toFixedFloorPercent(num) {
  if (num == 0) {
    return '/'
  }
  return toFixedFloor(num, 2) + '%'
}

/*
  函数，加法函数，用来得到精确的加法结果
  说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
  参数：arg1：第一个加数；arg2第二个加数；d要保留的小数位数（可以不传此参数，如果不传则不处理小数位数）
  调用：utils.Add(arg1,arg2,d)
  返回值：两数相加的结果
  */
export function Add(arg1, arg2) {
  arg1 = arg1.toString(), arg2 = arg2.toString();
  let arg1Arr = arg1.split("."), arg2Arr = arg2.split("."), d1 = arg1Arr.length == 2 ? arg1Arr[1] : "", d2 = arg2Arr.length == 2 ? arg2Arr[1] : "";
  let maxLen = Math.max(d1.length, d2.length);
  let m = Math.pow(10, maxLen);
  let result = Number(((arg1 * m + arg2 * m) / m).toFixed(maxLen));
  let d = arguments[2];
  return typeof d === "number" ? Number((result).toFixed(d)) : result;
}

/*
  函数：减法函数，用来得到精确的减法结果
  说明：函数返回较为精确的减法结果。
  参数：arg1：第一个加数；arg2第二个加数；d要保留的小数位数（可以不传此参数，如果不传则不处理小数位数
  调用：utils.Sub(arg1,arg2)
  返回值：两数相减的结果
  */
export function Sub(arg1, arg2) {
  return this.Add(arg1, -Number(arg2), arguments[2]);
}

  /*
  函数：乘法函数，用来得到精确的乘法结果
  说明：函数返回较为精确的乘法结果。
  参数：arg1：第一个乘数；arg2第二个乘数；d要保留的小数位数（可以不传此参数，如果不传则不处理小数位数)
  调用：utils.Mul(arg1,arg2)
  返回值：两数相乘的结果
  */
export function Mul(arg1, arg2) {
  let r1 = arg1.toString(), r2 = arg2.toString(), m, resultVal, d = arguments[2];
  m = (r1.split(".")[1] ? r1.split(".")[1].length : 0) + (r2.split(".")[1] ? r2.split(".")[1].length : 0);
  resultVal = Number(r1.replace(".", "")) * Number(r2.replace(".", "")) / Math.pow(10, m);
  return typeof d !== "number" ? Number(resultVal) : Number(resultVal.toFixed(parseInt(d)));
}

/*
函数：除法函数，用来得到精确的除法结果
说明：函数返回较为精确的除法结果。
参数：arg1：除数；arg2被除数；d要保留的小数位数（可以不传此参数，如果不传则不处理小数位数)
调用：utils.Div(arg1,arg2)
返回值：arg1除于arg2的结果
*/
export function Div(arg1, arg2) {
  let r1 = arg1.toString(), r2 = arg2.toString(), m, resultVal, d = arguments[2];
  m = (r2.split(".")[1] ? r2.split(".")[1].length : 0) - (r1.split(".")[1] ? r1.split(".")[1].length : 0);
  resultVal = Number(r1.replace(".", "")) / Number(r2.replace(".", "")) * Math.pow(10, m);
  return typeof d !== "number" ? Number(resultVal) : Number(resultVal.toFixed(parseInt(d)));
}
