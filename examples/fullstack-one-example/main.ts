import * as FullstackOne from '../../';
const $one = FullstackOne.getInstance();

$one.getEventEmitter().on('fullstack-one.*.ready',() => {
  console.log('EVENT: ready');
});

$one.getEventEmitter().on('fullstack-one.*.not-ready',(err) => {
  console.error('Error-EVENT: not-ready', err);
});

(async () => {
  try {
    const $one2 = await FullstackOne.getReadyPromise();
    console.log('PROMISE: ready');
  } catch (err) {
    console.error('Error-PROMISE: not-ready', err);
  }
})();

// catch another system event as a promise
(async () => {
  const payloadArray = await FullstackOne.eventToPromise('fullstack-one.*.dbObject.set');
  console.log('!!! PROMISED event caught fullstack-one.*.dbObject.set');
})();

// go
$one.getEventEmitter().on('fullstack-one.*.ready',async () => {

  try {

    $one.getDbSetupClient().on('notification', (msg) => {
      //if (msg.name === 'notification' && msg.channel === 'table_update') {

      console.error('*****', msg);
      /*var pl = JSON.parse(msg.payload);
			console.log("*========*");
			Object.keys(pl).forEach(function (key) {
				console.log(key, pl[key]);
			});
			console.log("-========-");
		}*/
    });
    $one.getDbSetupClient().query("LISTEN table_update");

    const res2 = await $one.getDbSetupClient().query('INSERT INTO users ("name") VALUES(\'123\')');
    console.error('*2', res2);

  } catch (err) {
    console.error(err);
  }

});