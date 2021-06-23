import Request from '@/tool/http';

// 获取token
export const login = (params) => Request.get('/first/user/login', { params });

// 以下为二期接口
// 获取token
export const loginFront = (params = {account: 'front', password: '21A63c985080'}) => Request.post('/api/login/front', params);


// 消息接口
export const messageList = (params) => Request.post('/api/rosLog/message/pageList', params);

// 未读消息总条数接口
export const messageUnread = ({address, type}) => Request.get(`/api/rosLog/message/hintTotal/${address}` + (type ? `/${type}` : '/0'));
export const messageReadById = (id) => Request.get(`/api/rosLog/message/read/${id}`);
export const messageReadAll = ({address, type}) => Request.get(`/api/rosLog/message/readAll/${address}` + (type ? `/${type}` : '/0'));
export const messageClearAll = ({address, type}) => Request.get(`/api/rosLog/message/clearAll/${address}` + (type ? `/${type}` : '/0'));
export const messageClearByIds = (ids = []) => Request.get(`/api/rosLog/message/clear/${ids.join(',')}`);

// 新增用户错误信接口
export const addError = (params) => Request.post('/api/dapp/error/add', params);

// 查询交易状态接口
export const hashState = (hash) => Request.get(`/api/dapp/hashState/${hash}`);
