const { ObjectID } = require('mongodb')
const pubsub = require('../pubsub');

module.exports = {
  // Format
  // < FieldKey > : (<parent>, <args>, <context>) => <resultResolve>

  Query: {
    allLinks: async (_, args, { mongo: {Links} }) => {
      return await Links.find({}).toArray();
    },
  },

  Mutation: {
    createLink: async (_, args, { mongo: { Links }, user }) => {
        const newLink = Object.assign({ postedById: user && user._id }, args);
        
        const response = await Links.insert(newLink);
        
        return Object.assign({id: response.insertedIds[0]}, newLink);
    },

    createVote: async (_, args, {mongo: {Votes}, user}) => {
      const newVote = {
        userId: user && user._id,
        linkId: new ObjectID(args.linkId),
      };

      const response = await Votes.insert(newVote);

      return Object.assign({id: response.insertedIds[0]}, newVote);
    },

    createUser: async (_, args, { mongo: { Users } }) => {
      const newUser = {
          name: args.name,
          email: args.authProvider.email.email,
          password: args.authProvider.email.password,
      };

      const response = await Users.insert(newUser);

      return Object.assign({ id: response.insertedIds[0] }, newUser);
    },

    signinUser: async (_, args, { mongo: { Users }}) => {
      const user = await Users.findOne({ email: args.email.email });
      
      if (args.email.password === user.password) {
        return { token: `token-${user.email}`, user };
      }
    },
    
  },

  User: {
    // Convert the "_id" field from MongoDB to "id" from the schema.
    id: root => root._id || root.id,

    votes: async ({_id}, args, {mongo: {Votes}}) => {
      return await Votes.find({userId: _id}).toArray();
    },
  },

  Link: {
    id: root => root._id || root.id,

    postedBy: async ({ postedById }, args, { dataloaders: { userLoader } }) => {
      return await userLoader.load(postedById);
    },

    votes: async ({ _id }, args, { mongo: { Votes }}) => {
        return await Votes.find({linkId: _id}).toArray();
    },
  },

  Vote: {
    id: root => root._id || root.id,

    user: async ({ userId }, data, { dataloaders: { userLoader } }) => {
      return await userLoader.load(userId);
    },

    link: async ({ linkId }, args, { mongo: { Links } }) => {
      return await Links.findOne({ _id: linkId });
    },
  },
};