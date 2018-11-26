var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');



///////////////////////////////////////////////////////////////////////////

var listOfVidsSchema = new Schema({

  videoName: {
    type: String,
    default: ' ',
    trim: false
  },

  videoURL: {
    type: String,
    default: '',
    required: true
  }
}, {
    timestamps: true
  }

);
///////////////////////////////////////////////////////////////////////////


var listOfListsSchema = new Schema({

  listName: {
    type: String,
    required: true,
    //		unique: true,
    default: ''
  },

  listOfVids: [listOfVidsSchema]

  // postedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // }
});

///////////////////////////////////////////////////////////////////////////

var User = new Schema({

  username: String,
  password: String,
  OauthId: String,
  OauthToken: String,

  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  admin: {
    type: Boolean,
    default: false
  },

  flags: {
    type: String,
    default: ''
  },

  geoLocation: {
    type: String,
    default: ''
  },

  IPAddress: {
    type: String,
    default: ''
  },

  emailAddress1: {
    type: String,
    default: ''
  },

  emailAddress2: {
    type: String,
    default: ''
  },

  listOfLists: [listOfListsSchema]
},

  {
    timestamps: true
  });


// methods ======================
User.methods.getName = function () {
  return (this.firstname + ' ' + this.lastname);
};


User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);