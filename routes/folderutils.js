//Mongo
var songSchema = require('../models/schemas/song');
var userSchema = require('../models/schemas/user');
var folderSchema = require('../models/schemas/folder');
var fs = require('fs');
var utils = require('./utils');
var ObjectId = require('mongoose/lib/types/objectid'); //for testing

exports.ownsFolders = function(req, res, next) {
	var folderid = req.params._id;
	console.log("folderid " + folderid);
	if (req.isAuthenticated()) {
		folderSchema.findById(folderid, function(err, docs) {
			console.log(docs)
			console.log(docs.author_id)
			if (!docs) {
				res.redirect('/members');
			} else if (docs.author_id == getAuthorId(req)) {
				next();
			} else {
				res.redirect('/members');
			}
		})
	} else {
		res.redirect('/login');
	}
}

exports.getUserFolders = function(req, res) { //can only get user's own folder
	var authorid = getAuthorId(req);
	var authorname = getAuthorName(req);
	var folders = [];

	folderSchema.find({author_id: authorid}, function(err, docs) {
		// res.render('folderview.ejs', {
		// 	title: 'enchord', 
		// 	isNew: false, 
		// 	authorName: authorname,
		// 	results: docs
		// });
		if (!docs) {
			res.send({userfolders: []});
		} else {
			res.send({userfolders: docs});
		}
	});
}

function getMyFolders(req, res, callback) {
	var authorid = getAuthorId(req);
	var authorname = getAuthorName(req);
	var folders = [];

	folderSchema.find({author_id: authorid}, function(err, docs) {
		if (!docs) {
			callback(folders);
		} else {
			callback(docs);
		}
	});
}

function getSongs(req, res, folderid, callback) {
	folderSchema.findById(folderid, function(err, folder) {
		console.log(folder);
		var foldername = folder.name;
		var songs = [];
		songSchema.find({folder_id: folderid, author_id: getAuthorId(req)}, function(err, foldersongs) { //search author_id also
			if (err) {
				console.log(err);
				res.status(500).json({message: 'Internal server error: cannot find', hasError: true});
				return;
			} else if (!foldersongs) {
				callback(songs);
			} else {
				// console.log(docs);
				callback({name: foldername, foldersongs: foldersongs});
				return;	
			}
		});
		return;
	});
}

exports.getUserFolders = function(req, res) {
	getMyFolders(req, res, function(data){
		res.send({userfolders: data});
	})
}

exports.getFoldersAndSongs = function(req, res, callback) {
	userfolders = [];
	getMyFolders(req, res, function(data){
		// var i = 0;
		// console.log(data);
		// for (var i in data) {
		// 	(function(i) {
  //   			setTimeout(function() {
	 //      			console.log(data[i]._id);
		// 			getSongs(req, res, data[i]._id, function(songs){
		// 			userfolders.push({folder: data[i], songs: songs});
		// 			console.log(i);
		// 			if (i == data.length - 1) {
		// 				console.log(userfolders);
		// 				callback(userfolders);
		// 			}
		// 		});
  //   		}, i * 1000);
  // 			})(i);
		// 	// console.log(folder[i]);
		// }
		callback(data);
	});
}

exports.getFolderSongs = function(req, res) {
	var folderid = req.params._id;
	getSongs(req, res, folderid, function(data){
		// res.render('foldersongs.ejs', {
		// 	title: 'enchord', 
		// 	isNew: false, 
		// 	folderName: foldername,
		// 	results: data
		// });
		res.send({folder: data});
	});
}

//need to check that the user can add songs to this folder
exports.addSongToFolder = function(req, res) {
	var songid = req.body.songid;
	var folderid = req.body.folderid;
	var authorid = getAuthorId(req);
	if (authorid == null) {
		return;
	} else {
		songSchema.findById(songid, function(err, docs){
			console.log('i am happy');
			console.log(docs);
			if (err) {
				console.log(err);
				res.status(500).json({message: 'Internal server error: Cannot add', hasError: true});
				return;
			}
			docs.folder_id = folderid;
			console.log(docs);
			docs.save(function(err, docs) {
				if (err) {
					console.log('i am sad');
				}
			});
			res.send({success: true, message: 'Song Added'});
		});	
		/*songSchema.update({_id: songid, author_id: authorid}, {folder_id: folderid}, function(err, numberAffected, rawResponse) {
			if (err) {
				console.log(err);
				res.status(500).json({message: 'Internal server error: Cannot add', hasError: true});
				return;
			} 
			console.log('add song to folder success');
			return;
		});*/
	}
}

//DOES NOT DELETE THE SONG. set the folder_id in the song to null
exports.deleteSongFromFolder = function(req, res) {
	var songid = req.params.songid;
	
	songSchema.update({_id: songid, author_id: getAuthorId(req)}, {folder_id: ''}, function(err, numberAffected, rawResponse) {
		if (err) {
			console.log(err);
			res.status(500).json({message: 'Internal server error: Cannot delete', hasError: true});
			return;
		}
		console.log('delete song from folder success');
		res.send({success: true});
		// res.render('foldersongs.ejs', {title: 'enchord', isNew: false, folderName: 'empty', results: ''});
		return;
	});
}

exports.makeFolder = function(req, res) {
	var foldername = req.params.name;
	var authorid = getAuthorId(req);
	var authorname = getAuthorName(req);
	var folder = new folderSchema({
		name: foldername,
		author_id: authorid,
		author_name: authorname
	});
	folder.save(function(err, docs, numberAffected) {
		if (err) {
			console.log(err);
			res.status(500).json({message: 'Internal server error: Cannot create', hasError: true});
			return;
		}
		console.log('success folder saved');
		console.log(folder);
		
		res.send({folder: docs});
		// res.render('foldersongs.ejs', {title: 'enchord', isNew: false, folderName: foldername, results: ''});
		return;
	});
}

//maybe make it similar to how editSong works? also later just make an editFolder page to have option to share
//folder sharing is ONLY FOR BANDS. What it means to share a folder: others can view, edit songs, add songs to the folder
/*exports.shareFolder = function(req, res) {
	var newuser = req.params.userid;
	var folderid = req.params.folderid;
	
	
	folderSchema.findById(folderid, function(err, docs) {
		docs['author_id'].push(newuser);
		folderSchema.update({_id: folderid}, {author_id: docs['author_id']}, function(err, numberAffected, rawResponse) {
			if (err) {
				console.log(err);
				res.status(500).json({message: 'Internal server error', hasError: true});
				return;
			}
			console.log('success edit');
			res.render('folderview.ejs', { //just shows a no info page for now
				title: 'enchord', 
				isNew: false, 
				authorName: '',
				results: []
			});
			return;
		});	
	});
}*/

exports.renameFolder = function(req, res) {
	var folderid = req.body.folderid;
	
	folderSchema.update({_id: folderid, author_id: getAuthorId(req)}, {name: req.body.name}, function(err, numberAffected, rawResponse) {
		if (err) {
			console.log(err);
			res.status(500).json({message: 'Internal server error', hasError: true});
			return;
		}
		console.log('success edit');
		res.send({success: true, message: 'Folder Renamed'});
		// res.render('folderview.ejs', { //just shows a no info page for now
		// 	title: 'enchord', 
		// 	isNew: false, 
		// 	authorName: '',
		// 	results: []
		// });
		return;
	});	

}

exports.deleteFolder = function(req, res) {
	var folderid = req.body.folderid;
	
	songSchema.update({folder_id: folderid, author_id: getAuthorId(req)}, {folder_id: ''}, function(err, numberAffected, rawResponse) {
		if (err) {
			console.log(err);
			res.status(500).json({message: 'Internal server error', hasError: true});
			return;
		}
		console.log('success edit');
		folderSchema.remove({_id: folderid, author_id: getAuthorId(req)}, function(err) {
			if (err) {
				console.log(err);
				res.status(500).json({message: 'Internal server error', hasError: true});
				return;
			}
			// res.render('folderview.ejs', { //just shows a no info page for now
			// title: 'enchord', 
			// isNew: false, 
			// authorName: '',
			// results: []
			// });
			res.send({success: true});
			return;
		});
		return;
	});	
}


function getAuthorId(req) {
	var id;
	if (req.user.local.email) {
		id = req.user._id;
	}
	if (req.user.facebook.token) {
		id = req.user.facebook.id;
	}
	if (req.user.twitter.token) {
		id = req.user.twitter.id;
	}
	if (req.user.google.token) {
		id = req.user.google.id;
	}
	return id;
}

function getAuthorName(req) {
	var name;
	if (req.user.local.email) {
		name = req.user.local.user;
	}
	if (req.user.facebook.token) {
		name = req.user.facebook.name;
	}
	if (req.user.twitter.token) {
		name = req.user.twitter.username;
	}
	if (req.user.google.token) {
		name = req.user.google.name;
	}
	return name;
}