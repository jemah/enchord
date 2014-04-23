'use strict';
var cleanSong = function(song) {
	if (song.title == undefined)
		song.title="";
	if (song.artist == undefined)
		song.artist="";
	if (song.genre == undefined)
		song.genre="";
	if (song.data == undefined)
		song.data="";
	if (song._id == undefined)
		song._id="";
	if (song.pub == undefined)
		song.pub=true;
	return song;
}
var getDate = function() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	var h = today.getHours();
	var m = today.getMinutes();
	var s = today.getSeconds();
	var ms = today.getMilliseconds();

	if(dd<10) {
    	dd='0'+dd
	} 
	if(mm<10) {
    	mm='0'+mm
	}
	if(h<10) {
    	h='0'+h
	} 
	if(m<10) {
    	m='0'+m
	} 
	if(s<10) {
    	s='0'+s
	} 
	if(ms<10) {
    	ms='0'+ms
	} 
	today = mm+dd+yyyy+h+m+s+ms;
	return today;
}

var enchordControllers = angular.module('enchordControllers', ['ngSanitize']);

// Home page controller
enchordControllers.controller('HomeController', ['$scope',
	function($scope) {
	}]);

// About page controller
enchordControllers.controller('AboutController', ['$scope',
	function($scope){
	}]);
enchordControllers.controller('ProfileController', [
	'$scope', 
	'$http', 
	'$location',
	'$route',
	'Side',
	function($scope, $http, $location, $route, Side){
		$scope.currentPage = 0;
		$scope.pageSize = 10;
		$scope.Side = Side;
		$scope.usersongs = [];
		$scope.userfolders = [];
		$scope.init = function() {
			Side.setPagetype('default');
			$http({
				method  : 'GET',
				url     : '/mysongs'
			}).success(function(data) {
				console.log(data);
				$scope.usersongs = data.usersongs;
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
			$http({
				method  : 'GET',
				url     : '/myfolders'
			}).success(function(data) {
				console.log(data);
				$scope.userfolders = data.userfolders;
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}
		$scope.numberOfPages = function() {
			return Math.ceil($scope.usersongs.length/$scope.pageSize);
		}
	}]);
// Search page controller 
enchordControllers.controller('SearchController', [
	'$scope', 
	'$window', 
	'$routeParams', 
	'$location', 
	'$http',
	'Side',
	function($scope, $window, $routeParams, $location, $http, Side) {
		$scope.query = $routeParams.query;
		$scope.globalresults = [];
		$scope.localresults = [];
		// $scope.type = "Both";
		// $scope.advquery = {}
		// $scope.init = function(query, type, title, artist, genre, author) {
		// 	$scope.query = query;
		// 	$scope.type = type;
		// 	$scope.advquery = {
		// 		title: title,
		// 		artist: artist,
		// 		genre: genre,
		// 		author: author
		// 	};
		// }
		$scope.init = function() {
			Side.setPagetype('search');
			$http({
				method : 'GET',
				url    : '/search',
				params : { query : $scope.query }
			}).success(function(data) {
				console.log(data);
				$scope.globalresults = data.results.global;
				$scope.localresults = data.results.local;
			});
		}
		// redirect to search page
		$scope.search = function() {
			console.log($scope.query);
			if ($scope.query != undefined && $scope.query.length > 0) {
				$location.url('search/' + $scope.query);
			}
		};
	}]);

// Song page (view) controller
enchordControllers.controller('SongViewController', [
	'$scope', 
	'$http', 
	'$window', 
	'$routeParams', 
	'$sce',
	function($scope, $http, $window, $routeParams, $sce){
		$scope.song = {};
		$scope.voted = false;
		$scope.isLoggedIn = false;
		$scope.isAuthor = false;
		$scope.hasvoted = function() {
			$http({
				method : 'GET',
				url    : '/hasvoted',
				params : { _id : $scope.song._id }
			}).success(function(data) {
				console.log(data);
				$scope.voted = data.voted;
			});
		}
		$scope.hasAuthor = function() {
			$http({
				method : 'GET',
				url    : '/isAuthor',
				params : { _id : $scope.song._id }
			}).success(function(data) {
				console.log(data);
				$scope.isAuthor = data.isAuthor;
			});
		}
		$scope.init = function(_id, isLoggedIn) {
			$scope.isLoggedIn = isLoggedIn;
			if(_id != undefined && _id.length != 0) {
				var getUrl = '/findsong/' + _id;
				$http({
					method  : 'GET',
					url     : getUrl
				}).success(function(data) {
					console.log(data);
					$scope.song = data.song;
					$scope.parsehtml();
					if (isLoggedIn) {
						$scope.hasvoted();
						$scope.hasAuthor();
					}
				}).error(function(data, status) {
					console.log(data);
					console.log(status);
					if (status == 500) {
						console.log(status);
						$scope.message = data.message;
						$scope.hasError = data.hasError;
					}
				});
			} else {
				$scope.song = {
					title: '',
					artist: '',
					genre: '',
					data: '',
					_id: '',
					upvote: 0,
					pub: true
				};
				$scope.parsehtml();
			}
		}
		$scope.gotoeditsong = function() {
			$window.location.href = "/members/editsong/" + $scope.song._id;
		}
		$scope.copysong = function() {
			// by default set public value to false
			$scope.song.pub = false;
			$http({
				method  : 'POST',
				url     : '/createsong',
				data    : $.param($scope.song),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data){
				console.log(data);
				
				// go to edit page
				var url = '/editsong/' + data.song._id;
				$window.location.href = url;
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}
		$scope.downloadpdf = function() {
			// var doc = new jsPDF();
			// doc.fromHTML($('#chord_sheet').get(0), 15, 15, {
			// 	'width': 170
			// });
			// doc.save('Test.pdf');
			html2canvas($('#chord_sheet'), {
    			onrendered: function(canvas) {
    				console.log(canvas);
    				var data = canvas.toDataURL('image/png');
    				// var data = canvas.toDataURL('application/pdf');
    				// $('.container').append('<a href=\"' + data + '\">Download pdf</a>');
    				var i = new Image(); 
					// i.onload = function(){
					// 	alert( i.width+", "+i.height );
					// };

					i.src = data;
					console.log(data);
    				var doc = new jsPDF();
					doc.addImage(data, 'PNG', 15, 15, i.width/4, i.height/4);
			 		// generate proper filename
			 		var titlewords = $scope.song.title.split(" ");
						var filename = "";
						for (var i = 0; i < titlewords.length; i++) {
							if (i == titlewords.length - 1) {
								filename = filename + titlewords[i] + ".pdf";
							} else {
								filename = filename + titlewords[i] + "_";
							}
						}
			 		doc.save(filename);
        		// canvas is the final rendered <canvas> element
    			}
			});
		}

		$scope.downloadtxt = function() {
			$http({
				method  : 'GET',
				url     : '/downloadsongtxt/' + $scope.song._id
			});
		}
		$scope.parsehtml = function() {
			$http({
				method  : 'POST',
				url     : '/parsesonghtml',
				data    : $.param($scope.song),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data) {
				console.log(data);
				$scope.song.result = data;
			});
		}
		// Guarantee that returned html is clean
		$scope.parsedResult = function() {
			return $sce.trustAsHtml($scope.song.result);
		}
		//upvote
		$scope.upvote = function() {
			$http({
				method : 'POST',
				url : '/upvote',
				data : $.param($scope.song),
				headers : {'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data) {
				console.log(data);
				$scope.song.upvote = data.vote;
				$scope.voted = true;
			});
		}
		//undo vote
		$scope.undovote = function() {
			$http({
				method : 'POST',
				url : '/undovote',
				data : $.param($scope.song),
				headers : {'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data) {
				console.log(data);
				$scope.song.upvote = data.vote;
				$scope.voted = false;
			});
		}
	}]);

// Song page (edit) controller
enchordControllers.controller('SongEditController', [
	'$scope', 
	'$routeParams', 
	'$http', 
	'$window',
	'$location',
	'$sce',
	'Side',
	function($scope, $routeParams, $http, $window, $location, $sce, Side){ 
		$scope.isNew = true;
		$scope.hasError = false;
		$scope.song = {};
  		var win = $window;
  		$scope.$watch('songEditForm.$dirty', function(value) {
    		if(value && !($scope.isNew)) {
      			win.onbeforeunload = function(){
        			return 'You have unsaved changes.';
      			};
    		} else {
    			win.onbeforeunload = function(){};
    		}
  		});

		$scope.parsehtml = function() {
			$http({
				method  : 'POST',
				url     : '/parsesonghtml',
				data    : $.param($scope.song),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data) {
				console.log(data);
				$scope.song.result = data + " parsed";
			});
		}

		// Guarantee that returned html is clean
		$scope.parsedResult = function() {
			return $sce.trustAsHtml($scope.song.result);
		}

		// $scope.init = function() {
		// 	var _id = $routeParams._id;
		$scope.init = function(_id) {
			// if(_id == undefined)
			// 	Side.setPagetype("createsong");
			// else
			// 	Side.setPagetype("editsong");
			if(_id != undefined && _id.length != 0) {
				var getUrl = '/findsong/' + _id;
				$http({
					method  : 'GET',
					url     : getUrl
				}).success(function(data) {
					console.log(data);
					if (data.song == undefined) { // if song does not exist
						console.log("Song not found");
						$window.location.href='/members/createsong';
						return;
					}
					$scope.song = data.song;
					$scope.isNew = false;
					$scope.parsehtml();
				}).error(function(data, status) {
					console.log(data);
					console.log(status);
					if (status == 500) {
						console.log(status);
						$scope.message = data.message;
						$scope.hasError = data.hasError;
					}
				});
			} else {
				$scope.song = {
					title: '',
					artist: '',
					genre: '',
					data: '',
					_id: '',
					pub: true
				};
				$scope.parsehtml();
			}
			console.log($scope.isNew);
		}

		$scope.createsong = function() {
			console.log("create " + $scope.song.title);
			console.log($('#data').val());
			console.log($scope.song);
			$scope.song.data = $('#data').val();
			$scope.song = cleanSong($scope.song);
			console.log($scope.song);
			$http({
				method  : 'POST',
				url     : '/createsong',
				data    : $.param($scope.song),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data){
				console.log(data);
				
				// go to edit page
				$scope.isNew = false;
				$window.location.href='/members/editsong/' + data.song._id;
				// $location.url(url);

				//$scope.song = data.song;
				//$scope.message = data.message;
				//$scope.hasError = data.hasError;
				//$scope.isNew = data.isNew;
				//$scope.songEditForm.$setPristine();
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}
		$scope.editsong = function(redirect) {
			console.log("edit " + $scope.song.title);
			$scope.song.data = $('#data').val();
			$scope.song = cleanSong($scope.song);
			$http({
				method  : 'POST',
				url     : '/editsong',
				data    : $.param($scope.song),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data){
				console.log(data);
				$scope.message = data.message;
				$scope.hasError = data.hasError;
				$scope.isNew = data.isNew;
				$scope.songEditForm.$setPristine();
				if(redirect)
					$window.location.href = '/members';
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}
		$scope.deletesong = function() {
			console.log("delete " + $scope.song.title);
			$http({
				method  : 'POST',
				url     : '/deletesong',
				data    : $.param($scope.song),
				headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
			}).success(function(data){
				console.log(data);
				if (data.isDeleted == true) {
					// redirect to different page later
					$window.location.href = '/members';
				}
				$scope.message = data.message;
				$scope.hasError = data.hasError;
				$scope.isNew = data.isNew;
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}
	}]);

// Signup controller
enchordControllers.controller('SignupController', ['$scope',
	function($scope){
		$scope.passMatch = true;
		// check that passwords match
		$scope.checkPass = function() {
			$scope.passMatch = $scope.signupForm.password.$viewValue == $scope.signupForm.password_repeat.$viewValue;
		}
	}]);

// Reset Password controller
enchordControllers.controller('ResetPasswordController', ['$scope',
	function($scope){
		$scope.passMatch = true;
		// check that passwords match
		$scope.checkPass = function() {
			$scope.passMatch = $scope.resetForm.password.$viewValue == $scope.resetForm.password_repeat.$viewValue;
		}
	}]);
// .directive('validPasswordC', function () {
//     return {
//         require: 'ngModel',
//         link: function (scope, elm, attrs, ctrl) {
//             ctrl.$parsers.unshift(function (viewValue, $scope) {
//                 var noMatch = (viewValue != scope.signupForm.password.$viewValue || viewValue != scope.signupForm.password_repeat.$viewValue)
//                 console.log(noMatch)
//                 ctrl.$setValidity('noMatch', !noMatch)
//             })
//         }
//     }
// });

// Login controller
enchordControllers.controller('LoginController', ['$scope',
	function($scope){
	}]);

enchordControllers.controller('BandController', [
	'$scope', 
	'$http', 
	'$location',
	'Side',
	function($scope, $http, $location, Side) {
		$scope.user = {}
		$scope.band = {}
		$scope.init = function() {
			Side.setPagetype('band');
			// $http({
			// 	method : 'GET',
			// 	url    : '/search',
			// 	params : { query : $scope.query }
			// }).success(function(data) {
			// 	console.log(data);
			// 	$scope.globalresults = data.results.global;
			// 	$scope.localresults = data.results.local;
			// });
			$http({
				method : 'GET',
				url    : '/getuserinfo'
			}).success(function(data) {
				console.log(data);
				if (data.id == undefined) {
					$location.url('/');
					return
				}
				$scope.user.username = data.username;
				$scope.user.id = data.id;
			});
			if ($routeParams._id != undefined) {
				$http({
					method : 'GET',
					url    : '/findband/' + $scope.band._id
				}).success(function(data){
					console.log(data);
					$scope.band = data.band;
				});
			}
		}
		$scope.createband = function() {
			$http({
				method : 'POST',
				url    : '/members/createband',
				params : {bandname : $scope.band.name}
			}).success(function(data){
				console.log(data);
				$location.url('/members/editband/' + data.band._id);
			})
		}
		$scope.editband = function() {
			$http({
				method : 'POST',
				url    : '/editband',
				params : {band : $scope.band}
			}).success(function(data){
				console.log(data);
			})
		}
		$scope.addmember = function(username) {
			$http({
				method : 'POST',
				url    : '/addmember',
				params : {bandid : $scope.band._id, username : username}
			}).success(function(data){
				console.log(data);
				if (!data.success) {
				} else {
					$http({
						method : 'GET',
						url    : '/findband/' + $scope.band._id
					}).success(function(data){
						console.log(data);
						$scope.band = data.band;
					});
				}
			});
		}
		$scope.deletemember = function(userid) {
			$http({
				method : 'POST',
				url    : '/deletemember',
				params : {bandid : $scope.band._id, userid : userid}
			}).success(function(data){
				console.log(data);
				if (!data.success) {
				} else {
					$http({
						method : 'GET',
						url    : '/findband/' + $scope.band._id
					}).success(function(data){
						console.log(data);
						$scope.band = data.band;
					});
				}
			});
		}
	}]);
enchordControllers.controller('BandViewController', [
	'$scope', 
	'$http', 
	'$location',
	'Side',
	function($scope, $http, $location, Side) {
		$scope.user = {}
		$scope.band = {}
		$scope.init = function() {
			Side.setPagetype('viewband');
			// $http({
			// 	method : 'GET',
			// 	url    : '/search',
			// 	params : { query : $scope.query }
			// }).success(function(data) {
			// 	console.log(data);
			// 	$scope.globalresults = data.results.global;
			// 	$scope.localresults = data.results.local;
			// });
			// $http({
			// 	method : 'GET',
			// 	url    : '/getuserinfo'
			// }).success(function(data) {
			// 	console.log(data);
			// 	if (data.id == undefined) {
			// 		$location.url('/');
			// 		return
			// 	}
			// 	$scope.user.username = data.username;
			// 	$scope.user.id = data.id;
			// });
			// if ($routeParams._id != undefined) {
			// 	$http({
			// 		method : 'GET',
			// 		url    : '/findband/' + $scope.band._id
			// 	}).success(function(data){
			// 		console.log(data);
			// 		$scope.band = data.band;
			// 	});
			// }
			// TEMP
			$http({
				method  : 'GET',
				url     : '/mysongs'
			}).success(function(data) {
				console.log(data);
				$scope.usersongs = data.usersongs;
				$scope.pagetype = "search";
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}
	}]);
enchordControllers.controller('FolderController', [
	'$scope', 
	'$routeParams', 
	'$http', 
	'$window',
	'$location',
	'$sce',
	'Side',
	function($scope, $routeParams, $http, $window, $location, $sce, Side) {
		$scope.folder = {};
		$scope.userfolders = [];
		$scope.init = function() {
			$http({
				method  : 'GET',
				url     : '/myfolders'
			}).success(function(data) {
				console.log(data);
				$scope.userfolders = data.usersongs;
			}).error(function(data, status) {
				console.log(data);
				console.log(status);
				if (status == 500) {
					console.log(status);
					$scope.message = data.message;
					$scope.hasError = data.hasError;
				}
			});
		}

		$scope.createfolder = function() {
			console.log("create " + $scope.folder.name);
			$http({
				method : 'GET',
				url    : '/createfolder/' + $scope.folder.name
			}).success(function(data){
				console.log(data);
				$window.location.href='/members';
			});
		}
	}]);
/* OLD CODE */
/* front-end parser */
// $scope.parse = function() {
// 	//readLines($scope.song.data, function(data){$scope.song.result = data});
// 	console.log($scope.song.data);
// 	$http({
// 		method  : 'GET',
// 		url     : '/parsesong',
// 		params  : { data : $scope.song.data }
// 		//headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
// 	}).success(function(data) {
// 		console.log(data);
// 		$scope.song.result = data + " parsed";
// 	});
// 	$http({
// 		method  : 'POST',
// 		url     : '/parsesong',
// 		data    : $.param($scope.song),
// 		headers : { 'Content-Type': 'application/x-www-form-urlencoded' }
// 	}).success(function(data) {
// 		console.log(data);
// 		$scope.song.result = data + " parsed";
// 	});
// }
/* profile controller */
// enchordControllers.controller('ProfileController', ['$scope', '$http',
// 	function($scope, $http){
// 		$scope.usersongs = {};
// 		$scope.init = function() {
// 			$http({
// 				method  : 'GET',
// 				url     : '/mysongs'
// 			}).success(function(data) {
// 				console.log(data);
// 				$scope.usersongs = data.sersongs;
// 			}).error(function(data, status) {
// 				console.log(data);
// 				console.log(status);
// 				if (status == 500) {
// 					console.log(status);
// 					$scope.message = data.message;
// 					$scope.hasError = data.hasError;
// 				}
// 			});
// 		}
// 	}]);