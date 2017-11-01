const http = require('http');
const toRegExp = require('path-to-regexp');

class Serless {
  constructor() {
    this._middlewares = [];
    this.routerObject = {};
    this.routerKeys = [];
    this.server = http.createServer(this.serless.bind(this));
    this.get = (url, handler) => this._get(url, handler);
    this.post = (url, handler) => this._post(url, handler);
  }
  use(fn) {
    this._middlewares.push(fn);
  }
  listen(port, address, cb) {
    this.server.listen(port, address, cb);
  }
  onSend(res) {
    return payload =>
      setImmediate(() => {
        res.writeHead(200);
        res.end(payload);
      });
  }
  serless(req, res) {
    const { method, url } = req;
    let match;

    res.send = this.onSend(res);
    // res.on('finish', () => console.log('[SERLESS] => finish'));
    res.on('error', err => console.log('[SERLESS ERROR] =>', err));

    const handleResponse = () => {
      let keys = [];
      let params = {};
      const hasRoute = this.routerObject[url];
      if (hasRoute) return hasRoute.handler(req, res);
      const split = url.split('/');
      const first = '/' + split[1];
      const len = split.length - 1;
      for (let o in this.routerObject) {
        if (this.routerObject[o].keyLen === len) {
          const pattern = toRegExp(o, keys);
          const match = pattern.exec(url);
          if (match) {
            for (let i = 1; i < match.length; i++) {
              params[keys[i - 1].name] =
                match[i] !== undefined ? match[i] : undefined;
            }
            req.params = params;
            this.routerObject[o].handler(req, res);
            break;
          }
        }
      }
    };

    if (this._middlewares.length === 1) {
      this._middlewares[0](req, res, handleResponse);
    } else {
      const handleMiddlewares = idx => {
        if (idx + 1 > this._middlewares.length) return handleResponse();
        this._middlewares[idx](req, res, () => handleMiddlewares(idx + 1));
      };
      handleMiddlewares(0);
    }
  }
  _get(url, handler) {
    this.routerObject[url] = {
      pattern: url,
      handler,
      keyLen: url.split('/').length - 1
    };
    this.routerKeys.push(url);
    return this;
  }
  _post(url, handler) {
    this.routerObject[url] = {
      pattern: url,
      handler,
      keyLen: url.split('/').length - 1
    };
    this.routerKeys.push(url);
    return this;
  }
}

module.exports = Serless;
