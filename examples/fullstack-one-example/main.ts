import * as FullstackOne from '../../';
const $one = FullstackOne.getInstance();

$one.getEventEmitter().on('fullstack-one.ready',() => {
  console.log('!!! EVENT', $one.getApp());
});

(async () => {
  const $one2 = await FullstackOne.getBootingPromise();
  console.log('!!! PROMISE', $one2.getDbObject());
  console.log('Config', $one2.getConfig());
})();

// catch anotehr system event as a promise
(async () => {
  const payloadArray = await FullstackOne.eventToPromise('fullstack-one.dbObject.set');
  console.log('!!! PROMISED event caught fullstack-one.dbObject.set:', payloadArray);
})();
