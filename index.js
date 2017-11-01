const http = require('http');
const toRegExp = require('path-to-regexp');

class Serless {
  constructor() {
    this._middlewares = [];
    this._routerObject = {
      GET: {},
      POST: {}
    };
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

    const handleResponse = method => {
      let keys = [];
      let params = {};
      let hasMatch = false;
      const hasRoute = this._routerObject[url];
      if (hasRoute && method === hasRoute.method)
        return hasRoute.handler(req, res);
      const split = url.split('/');
      const first = '/' + split[1];
      const len = split.length - 1;
      for (let o in this._routerObject[method]) {
        if (this._routerObject[method][o].keyLen === len) {
          const pattern = toRegExp(o, keys);
          const match = pattern.exec(url);
          if (match) {
            hasMatch = true;
            for (let i = 1; i < match.length; i++) {
              params[keys[i - 1].name] =
                match[i] !== undefined ? match[i] : undefined;
            }
            req.params = params;
            this._routerObject[method][o].handler(req, res);
            break;
          }
        }
      }
      if (!hasMatch) {
        res.writeHead(404);
        res.send('Not Found');
      }
    };

    if (this._middlewares.length === 1) {
      this._middlewares[0](req, res, handleResponse.bind(this, method));
    } else {
      const handleMiddlewares = idx => {
        if (idx + 1 > this._middlewares.length) return handleResponse(method);
        this._middlewares[idx](req, res, () => handleMiddlewares(idx + 1));
      };
      handleMiddlewares(0);
    }
  }
  _get(url, handler) {
    this._routerObject['GET'][url] = {
      pattern: url,
      handler,
      keyLen: url.split('/').length - 1
    };
    return this;
  }
  _post(url, handler) {
    this._routerObject['POST'][url] = {
      pattern: url,
      handler,
      keyLen: url.split('/').length - 1
    };
    return this;
  }
}

module.exports = Serless;
