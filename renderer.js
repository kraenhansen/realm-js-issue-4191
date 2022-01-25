const Realm = require("realm");
const jwt = require('jsonwebtoken');
const { ApolloClient, HttpLink, InMemoryCache } = require("@apollo/client");
const gql = require("graphql-tag");

const APP_ID = 'graphql-jwt-test-ydhgb';
const SECRET = '2k66QfKeTRk3MdZ5vpDYgZCu2k66QfKeTRk3MdZ5vpDYgZCu';
// Some random but unique user id
const USER_ID = '268F1C63-928C-4FBD-9330-E302578ACCCD';

const app = Realm.App.getApp(APP_ID);
const graphqlUri = `https://us-east-1.aws.realm.mongodb.com/api/client/v2.0/app/${APP_ID}/graphql`;
// const graphqlUri = `https://realm.mongodb.com/api/client/v2.0/app/${APP_ID}/graphql`;

async function getValidAccessToken() {
  if (app.currentUser) {
    console.log("Already authenticated - logging out");
    await app.currentUser.logOut();
  }
  console.log("Authenticating");
  const token = jwt.sign({
    aud: APP_ID,
    sub: USER_ID,
  }, SECRET, {
    expiresIn: '1h'
  });
  console.log("Sending token", token);
  const credentials = Realm.Credentials.jwt(token);
  const user = await app.logIn(credentials);
  console.log("Authenticated as", user.id);
  return user.accessToken;
}

async function run() {
  const client = new ApolloClient({
    link: new HttpLink({
      uri: graphqlUri,
      fetch: async (uri, options) => {
        const accessToken = await getValidAccessToken();
        options.headers.Authorization = `Bearer ${accessToken}`;
        return fetch(uri, options);
      },
    }),
    cache: new InMemoryCache(),
  });
  const query = gql`
    query {
      task {
        _id
        description
      }
    }
  `;
  console.log(query);
  // Try requesting something
  const response = await client.query({ query });
  // Show the response
  const output = document.getElementById("output");
  output.innerText = JSON.stringify(response);
}

run().catch(console.error);