const express = require('express');
const cors = require('cors');
const { json } = require('body-parser');
const fs = require('fs');
const { graphqlHTTP } = require('express-graphql');
const parse = require('csv-parse/lib/sync');

const app = express()
  .use(cors())
  .use(json());

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList
} = require('graphql');

const users = []

const cities = []

const CityType = new GraphQLObjectType({
  name: 'City',
  description: 'This represents a city visited by an user',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    city_name: { type: GraphQLNonNull(GraphQLString) },
    country_name: { type: GraphQLNonNull(GraphQLString) },
    date_visited: { type: GraphQLNonNull(GraphQLString) },
    userId: { type: GraphQLNonNull(GraphQLInt) },
    user: {
      type: UserType,
      resolve: (city) => {
        return users.find(user => user.id === city.userId)
      }
    }
  })
})

const UserType = new GraphQLObjectType({
  name: 'User',
  description: 'This represents a user which visited a city',
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    first_name: { type: GraphQLNonNull(GraphQLString) },
    last_name: { type: GraphQLNonNull(GraphQLString) },
    age: { type: GraphQLNonNull(GraphQLInt) },
    cities: {
      type: new GraphQLList(CityType),
      resolve: (user) => {
        return cities.filter(city => city.userId === user.id)
      }
    }
  })
})

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root Query',
  fields: () => ({
    user: {
      type: UserType,
      description: 'a single user',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => users.find(user => user.id === args.id)
    },
    users: {
      type: new GraphQLList(UserType),
      description: 'List of All users',
      resolve: () => users
    },
    cities: {
      type: new GraphQLList(CityType),
      description: 'List of All Cities',
      resolve: () => cities
    },
    city: {
      type: CityType,
      description: 'A Single city',
      args: {
        id: { type: GraphQLInt }
      },
      resolve: (parent, args) => cities.find(city => city.id === args.id)
    }
  })
})

const RootMutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root Mutation',
  fields: () => ({
    addCity: {
      type: CityType,
      description: 'Add a city',
      args: {
        city_name: { type: GraphQLNonNull(GraphQLString) },
        country_name: { type: GraphQLNonNull(GraphQLString) },
        date_visited: { type: GraphQLNonNull(GraphQLString) },
        userId: { type: GraphQLNonNull(GraphQLInt) }
      },
      resolve: (parent, args) => {
        const city = {
          id: cities.length + 1,
          city_name: args.city_name,
          country_name: args.country_name,
          date_visited: args.date_visited,
          userId: args.userId }
        cities.push(city)
        return city
      }
    },
    addUser: {
      type: UserType,
      description: 'Add a user',
      args: {
        first_name: { type: GraphQLNonNull(GraphQLString) },
        last_name: { type: GraphQLNonNull(GraphQLString) },
        age: { type: GraphQLNonNull(GraphQLInt) }
      },
      resolve: (parent, args) => {
        const user = {
          id: users.length + 1,
          first_name: args.first_name,
          last_name: args.last_name,
          age: args.age
        }
        users.push(user)
        return user
      }
    }
  })
})

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType
})

app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true
}))

app.listen(3000, (err) => {
  if (err) {
    return console.log(err);
  }
  return console.log('Server listening on port 3000');
});

module.exports = new GraphQLSchema({query: RootQueryType, mutation: RootMutationType});
