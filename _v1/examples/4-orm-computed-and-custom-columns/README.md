# 4 ORM Comupted and Custom Columns

Computed and Custom columns are not persisted in the database. The difference between those two is, that computed columns are calculated using an expression (thus is executed in the database) and custom columns are calculated by a function within node js.

## Usage Computed Column

In case of a `BankAccount`, you can store each financial transaction and compute the current account balance based on the those transactions instead of persisting the account balance redundantly.

```ts
@Entity()
class BankAccount {
  @Computed({ "getBalance" })
  public balance: () => Promise<number>;
}
```

For the graphql endpoint, computed columns get's resolved transparently.

## Usage Custom Column

Custom columns are usefull, if you have external API, that you want to call for additional information. Let's say, you want to add the current number of tweets to a user object. Currently this only works for the graphql endpoint and not using the typeORM repository.

```ts
const $gql: GraphQl = Container.get(GraphQl);

$gql.addResolvers({
  someQuery: () => {
    return "Hello query";
  }
});

@Entity()
class User {
  @Column()
  public twitterName: string;

  @Custom({ resolver: "someQuery", gqlType: "String" })
  public numberOfTweets: () => Promise<number>;
}
```

For the graphql endpoint, computed columns get's resolved transparently.
