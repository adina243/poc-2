const redis = require("redis");
const shortid = require("shortid");
const util = require('util');
// Redis
const redisHost = process.env.REDIS_HOST || 'localhost';  // Utiliser 'localhost' comme valeur par défaut si non définie
const redisPort = process.env.REDIS_PORT || 6379;         // Utiliser 6379 par défaut
const redisPassword = process.env.REDIS_PASSWORD || '';

exports.CheckRedis = function () {
    //const checkRedis = redis.createClient();
    console.log(`Redis connection attempt on host [${redisHost}] and port [${redisPort}]`);
    const checkRedis = redis.createClient({
        host: redisHost,
        port: redisPort,
        password: redisPassword
    });
    checkRedis.on("error", function (error) {
        console.error("error: cannot connect to Redis", error);
        process.exit(1)
    });
}
// redis keyspace:
// task:<type>:<short-id> ...
// task:github:PPBqWA9
// related cookies are another HMSET like:
// task:<type>:<short-id>
exports.AddTask = function (name, task, cookies) {
    const client = redis.createClient();
    client.on("error", function (error) {
        console.error("redis error: " + error);
    });

    const id = shortid.generate();

    // NOTE: cookies is base64 encoded JSON stringify of all cookies array. makes redis mapping less complicated
    //console.log(`Adding to redis task ${task}:${id} with cookies`)

    const key = `task:${task}:${id}`;
    client.hmset([key, "name", name, "cookies", cookies, "status", "queued"], function (err, res) {
        // TODO catch errors if any
    });

    return key;
}

exports.AddExtrudedData = function (key, entryKey, entryValue) {
    const client = redis.createClient();
    client.on("error", function (error) {
        console.error("redis error: " + error);
    });

    const id = shortid.generate();
    let dataKey = `${key}:extruded`
    let dataKeyId = `${dataKey}:${id}`
    client.rpush([dataKey, dataKeyId], function (err, reply) {
        //console.log(`rpush in ${dataKey} of ${dataKeyId}`);
    });

    client.hmset([dataKeyId, "url", entryKey, "encoded", entryValue], function (err, res) {
        //console.log(`hmset on ${dataKeyId}`);
    });
}

exports.UpdateTaskStatus = async function (key, status) {
    const client = redis.createClient();

    client.on("error", function (error) {
        console.error("redis error: " + error);
    });

    const hget = util.promisify(client.hget).bind(client);
    let currentStatus = await hget(key, "status");
    client.hmset([key, 'status', status], function (err, res) {
    });
    console.log(`[${key}] status (${currentStatus}) changed to -> ${status}`)

}

exports.UpdateTaskStatusWithReason = async function (key, status, reason) {
    const client = redis.createClient();

    client.on("error", function (error) {
        console.error("redis error: " + error);
    });

    const hget = util.promisify(client.hget).bind(client);
    let currentStatus = await hget(key, "status");
    client.hmset([key, 'status', status], function (err, res) {
    });
    console.log(`[${key}] status (${currentStatus}) changed to -> ${status}`)

    // used to add error details if any, or any other info to decorate status
    let currentReason = await hget(key, "reason");
    client.hmset([key, 'reason', reason], function (err, res) {
    });
    console.log(`[${key}] reason (${currentReason}) changed to -> ${reason}`)

}

exports.GetTask = async function (key) {
    const client = redis.createClient();

    client.on("error", function (error) {
        console.error("redis error: " + error);
    });

    const hgetall = util.promisify(client.hgetall).bind(client);
    const hget = util.promisify(client.hget).bind(client);
    const lrange = util.promisify(client.lrange).bind(client);

    let status = await hget(key, "status");
    // todo implement as switch
    if (status === "queued") {
        return ["queued", null]
    } else if (status === "error") {
        let error = await hget(key, "error");
        let reason = await hget(key, "reason");
        return ["error", reason]
    } else {
        // todo check status === done
        let dataKey = `${key}:extruded`;

        // NOTE we need to promisify the redis-node calls to make it fully async and properly return values
        try {
            let extruded_entries = await lrange(dataKey, 0, -1)
            let result = []
            for (let key of extruded_entries) {
                let value = await hgetall(key);
                result.push(value)
            }

            return [status, result];
        } catch (e) {
            console.log(`getTask error:${e}`);
            return ["error", e]
        }
    }
}

exports.GetCredentials = async function (key) {
    const client = redis.createClient();

    client.on("error", function (error) {
        console.error("redis error: " + error);
    });

    const hgetall = util.promisify(client.hgetall).bind(client);
    const hget = util.promisify(client.hget).bind(client);
    const lrange = util.promisify(client.lrange).bind(client);

    let status = await hget(key, "status");
    // get number of creds
    let _num = await hget(key, "creds_count");
    let num = parseInt(_num);
    let res = [];
    for (let i = 0; i < num; i++) {
        let _r = await hgetall(`${key}:creds:${i}`);
        res.push(_r);
    }
    // todo implement as switch
    if (res.length === num) {
        return res;

    } else {
        console.log(`getcredentials error:`);
        return ["error", "getcredentials"];
    }
}