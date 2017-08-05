module.exports = {
  // Format
  // < FieldKey > : (<parent>, <args>, <context>) => <resultResolve>

  Query: {
    allLinks: async (_, args, { mongo: {Links} }) => {
      return await Links.find({}).toArray();
    },
  },

  Mutation: {
    createLink: async (root, args, { mongo: { Links }, user }) => {
        const newLink = Object.assign({ postedById: user && user._id }, args);
        
        const response = await Links.insert(newLink);
        
        return Object.assign({id: response.insertedIds[0]}, newLink);
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
  },

  Link: {
    id: root => root._id || root.id,

    postedBy: async ({ postedById }, args, { mongo: { Users } }) => {
        return await Users.findOne({_id: postedById});
    },    
  },
};