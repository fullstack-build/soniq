const Koa = require("koa");
const Router = require("koa-router");
const send = require("koa-send");
const PassThrough = require("stream").PassThrough;
const compress = require("koa-compress");
const { Client } = require("pg");

const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "eugene",
    password: "",
    port: 5432,
});
client.connect();

// response header for sever-sent events
const SSE_RESPONSE_HEADER = {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no"
};

const app = new Koa();
// !!attention : if you use compress, sse must use after compress
app.use(compress());
var router = new Router();


router.get("/", async (ctx) => {
    await send(ctx, "index.html");
});


router.get(`/sub`, async (ctx) => {

    /* handle disconnection
    ctx.req.on("close", ctx.res.end());
    ctx.req.on("finish", ctx.res.end());
    ctx.req.on("error", ctx.res.end());
    */

    // get sql query for subscription
    const sqlQuery = JSON.parse(ctx.query && ctx.query.query && ctx.query.query || "{}").sql;
    console.log("sqlQuery", sqlQuery);

    try {
        // subscribe
        const result = await client.query(`INSERT INTO subscriptions (query) VALUES($1) RETURNING id;`, [sqlQuery]);
        console.log("QUERY STORED: ", result);
        const subscriptionId = result.rows[0].id;
        // subscribe
        client.query(`LISTEN "${subscriptionId}"`);
        client.on("notification", async (msg) => {
            try {
                //const newRows = JSON.parse(msg.payload);
                //const updatedRows = await client.query(`SELECT row_to_json(*) FROM "${subscriptionId}_current" WHERE id = ANY($1);`, [newRows]);
                //console.log("--------------");
                //console.log(updatedRows);

                // access db with user transaction and find changed rows
                const updatedRows = await client.query(`SELECT cur.result FROM "${subscriptionId}_current" cur FULL OUTER JOIN "${subscriptionId}_previous" prev ON cur.hash = prev.hash WHERE prev.hash IS NULL;`);
                // update materialized view in user transaction
                await client.query(`REFRESH MATERIALIZED VIEW "${subscriptionId}_previous"; -- don"t run CONCURRENTLY, otherwise we miss out;`);
                console.log("#", updatedRows);
                send("query", JSON.stringify(updatedRows.rows));
            } catch (err) {
                console.error(err);
            }
        });

        const disconnect = async (subscriptionId) => {
            await client.query(`DELETE FROM subscriptions WHERE id = $1;`, [subscriptionId]);
        };

        // handle disconnects
        ctx.req.on("close", () => disconnect(subscriptionId));
        ctx.req.on("finish", () => disconnect(subscriptionId));
        ctx.req.on("error", () => disconnect(subscriptionId));

        // set header
        ctx.set(SSE_RESPONSE_HEADER);
        ctx.status = 200;
        ctx.flushHeaders();

        // create stream of events
        const stream = new PassThrough();
        ctx.body = stream;
        // send event to client
        const send = (event, data) => {
            stream.write(`event:${ event }\ndata: ${ data }\n\n`);
        };

    } catch (err){
        console.error(err);
        ctx.status = 500;
        ctx.body = {error: err};
    }

//send("query", sqlQuery);


});


app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3000);
console.log("Server port: 3000");
