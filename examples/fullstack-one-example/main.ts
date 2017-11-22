import * as FullstackOne from '../../packages/core/main';
const $one = FullstackOne.getInstance();

$one.getEventEmitter().on('fullstack-one.ready',() => {
  console.log('!!! EVENT', $one.getApp());
});

(async () => {
  const $one2 = await FullstackOne.getBootingPromise();
  console.log('!!! Promise', $one2.getApp());
})();
