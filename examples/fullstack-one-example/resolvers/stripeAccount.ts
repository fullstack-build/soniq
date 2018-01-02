
export default (obj, args, context, info, $one) => {

  return new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('This is Stripe ' + Math.random());
    }, 1000);
  });
};
