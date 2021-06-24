import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: 'https://api.thegraph.com/subgraphs/name/melanimarrufofwo/burnlogs',
})

// Cache implementation
const cache = new InMemoryCache()

// Create the apollo client
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
  fetchPolicy: "no-cache"
})

// import ApolloClient from 'apollo-boost'

// export const apolloClient = new ApolloClient({
//   // You should use an absolute URL here
//   uri: 'https://api.thegraph.com/subgraphs/name/melanimarrufofwo/burnlogs'
// })