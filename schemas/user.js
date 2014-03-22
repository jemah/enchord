var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var validatePrescenseOf = function(value) {
	return value && value.length;
}

var toLower = function(string){
	return string.toLowerCase();
}

var User = new Schema({
	user: { type: String,
		validate: [validatePrescenseOf, 'a Username is required'],
		set: toLower,
		index: {unique: true}
	},
	email: String,
	password: String
});



module.exports = mongoose.model('Users', User);