'use strict';

class SocketUtils {
  getToken(cookies) {
    if (cookies) {
      let token = cookies.match(/(?:Token=)(.+)/g);
      if (token) {
        token = token[0].substring(6, token[0].length);
        return token;
      }
    }
    return '';
  }

  handleToken(obj) {
    if (obj.handshake.headers.cookie) {
      let cookie = obj.handshake.headers.cookie;
      let token = this.getToken(cookie);
      return token;
    } else if (obj.handshake.query.token) {
      return obj.handshake.query.token;
    }
    return false;
  }
}

module.exports = new SocketUtils();
