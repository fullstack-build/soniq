- Query all columns and relations (Including the computed columns)



```js
const transaction = one.createTransaction();

const postIdAlias = transaction.createPostOwner({
  title: "Foobar",
  content: "This is foobar"
});


const postCommentIdAlias = transaction.createPostCommentOwner({
  message: "Hello World!",
  postId: postIdAlias
});

await transaction.run();
```

## Get one post
```js
const post = await one.Post.findOne({where: {id: {equals: "123"}}});
```

## Get all posts
```js
const posts = await one.Post.findMany();
```

## Get some posts
```js
const posts = await one.Post.findMany({where: {title: {like: "A%"}}});
```

## Mutate one post
```js
const post = await one.Post.findOne({where: {id: {equals: "123"}}});

post.title = "Foobar";

await one.Post.updateOwner(post);
```

## Mutate multiple post
```js
const posts = await one.Post.findOne();

const transaction = one.createTransaction();

posts.forEach((post) => {
  post.title = "Foobar";

  transaction.Post.updateOwner(post);
});

await transaction.run();
```

## Create one post
```js
const post = await one.Post.createOwner({
  title: "Foobar 2"
});
```

## Create multiple posts in transaction
```js
const transaction = one.createTransaction();

transaction.Post.createOwner({
  title: "Foobar 3"
});

transaction.Post.createOwner({
  title: "Foobar 4"
});

await transaction.run();
```

## Create post with comment in transaction
```js
const transaction = one.createTransaction();

const postIdPlaceholder = transaction.Post.createOwner({
  title: "Foobar 4"
});

transaction.Comment.createOwner({
  message: "Hello World",
  post: postIdPlaceholder
});

await transaction.run();
```

## Mutate one post as admin
```js
const post = await one.Posts.findOne({where: {id: {equals: "123"}}});

post.secretServerStuff = "Foobar";

one.Posts.update(post);
```