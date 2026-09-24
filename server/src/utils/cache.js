const NodeCache = require('node-cache');

// Standard TTL of 1 hour, check periodically for expired keys every 2 minutes
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

module.exports = myCache;
