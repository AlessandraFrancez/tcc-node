const { RateLimiterMemory } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 10
});

class RateLimiting {
  index(req, res, next) {
    console.log('req', req.headers.cookie)
    rateLimiter.consume(req.headers.cookie)
      .then(() => {
        console.log('1 ponto*********************')
        next();
      })
      .catch(() => {
        console.log('IP Blocked*****')
        res.status(429).json({ message: 'Too many requests' });
      });
  }
}

module.exports = new RateLimiting();
