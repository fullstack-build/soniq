import * as ONE from '../../';

const $one = ONE.getInstance();

ONE.Container.get(ONE.EventEmitter).on('f1.ready',() => {
  console.log('EVENT: ready');
});

ONE.Container.get(ONE.EventEmitter).on('f1.not-ready',(err) => {
  console.error('Error-EVENT: not-ready', err);
});

(async () => {
  try {
    const $one2 = await ONE.getReadyPromise();
    console.log('PROMISE: ready');
  } catch (err) {
    console.error('Error-PROMISE: not-ready', err);
  }
})();

// catch another system event as a promise
(async () => {
  const payloadArray = await ONE.eventToPromise('f1.dbObject.set');
  console.log('!!! PROMISED event caught fullstack-one.*.dbObject.set');
})();

// catch events from other nodes
ONE.Container.get(ONE.EventEmitter).onAnyInstance('f1.ready', async (instanceId) => {
  console.log('* ready event on any node', instanceId);
});

// go
/*$one.getEventEmitter().on('f1.ready', async (instanceId) => {

  // console.log($one.getDbMeta());
  // console.log(JSON.stringify($one.getDbMeta(), null, 2));
  console.log('------------------');
  $one.runMigration();

});
*/