var sodium = require('sodium-native');
const crypto = require('crypto');

const sha256 = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
}
const sha512 = (input) => {
  return crypto.createHash('sha512').update(input).digest('hex');
}

//console.log('sha', sha256('test'))
//console.log('sha', sha512('test'))

/*
console.log(sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE)
console.log(sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE)
console.log(sodium.crypto_pwhash_MEMLIMIT_MODERATE)
console.log(sodium.crypto_pwhash_OPSLIMIT_MODERATE)
console.log(sodium.crypto_pwhash_MEMLIMIT_SENSITIVE)
console.log(sodium.crypto_pwhash_OPSLIMIT_SENSITIVE)
console.log(sodium.crypto_pwhash_ALG_DEFAULT)
console.log(sodium.crypto_pwhash_ALG_ARGON2ID13)
console.log(sodium.crypto_pwhash_ALG_ARGON2I13)

console.log(sodium.crypto_pwhash_BYTES_MIN)
console.log(sodium.crypto_pwhash_BYTES_MAX)

console.log(sodium.crypto_pwhash_STRBYTES)

const opslimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
const memlimit = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
const algorithm = sodium.crypto_pwhash_ALG_DEFAULT;

var password = 'test1234';

const passwordBuffer = Buffer.from(password);

var hashBuffer = Buffer.allocUnsafe(sodium.crypto_pwhash_STRBYTES);

var saltBuffer = Buffer.allocUnsafe(sodium.crypto_pwhash_SALTBYTES);

sodium.randombytes_buf(saltBuffer)

sodium.crypto_pwhash(hashBuffer, passwordBuffer, saltBuffer, opslimit, memlimit, algorithm)

console.log(hashBuffer.toString('hex'))

sodium.crypto_pwhash(hashBuffer, passwordBuffer, saltBuffer, opslimit, memlimit, algorithm)

console.log(hashBuffer.toString('hex'))*/

function newHash(password) {
  return new Promise((resolve, reject) => {
    const opslimit = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE;
    const memlimit = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE;
    const algorithm = sodium.crypto_pwhash_ALG_DEFAULT;

    const passwordBuffer = Buffer.from(password);

    var hashBuffer = Buffer.allocUnsafe(sodium.crypto_pwhash_STRBYTES);

    var saltBuffer = Buffer.allocUnsafe(sodium.crypto_pwhash_SALTBYTES);

    sodium.randombytes_buf(saltBuffer);

    const meta = {
      salt: saltBuffer.toString('hex'),
      hashBytes: sodium.crypto_pwhash_STRBYTES,
      opslimit,
      memlimit,
      algorithm
    }

    sodium.crypto_pwhash_async(hashBuffer, passwordBuffer, saltBuffer, opslimit, memlimit, algorithm, (err) => {
      if (err != null) {
        return reject(err);
      }

      const hash = hashBuffer.toString('hex');

      resolve({
        hash,
        meta
      })
    });
  });
}

function hashByMeta(password, meta) {
  return new Promise((resolve, reject) => {
    const passwordBuffer = Buffer.from(password);

    var hashBuffer = Buffer.allocUnsafe(meta.hashBytes);

    var saltBuffer = Buffer.from(meta.salt, 'hex');

    sodium.crypto_pwhash_async(hashBuffer, passwordBuffer, saltBuffer, meta.opslimit, meta.memlimit, meta.algorithm, (err) => {
      if (err != null) {
        return reject(err);
      }

      const hash = hashBuffer.toString('hex');

      resolve({
        hash,
        meta
      })
    });
  });
}

newHash('test1234').then((data)=>{
  console.log('First', data)
  console.log(sha256(data.hash))
}).catch((err) => {
  console.log(err)
})

/*newHash('test1234').then((data)=>{
  console.log('First', data)
  hashByMeta('test1234', data.meta).then((info)=>{
    console.log('Second', info)
  }).catch((err) => {
    console.log(err)
  })
}).catch((err) => {
  console.log(err)
})*/
