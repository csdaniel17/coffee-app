var app = angular.module('coffee-app', ['ngRoute', 'ngCookies']);

app.config(function($routeProvider){
  $routeProvider
    .when('/', {
      controller: 'MainController',
      templateUrl: '/home.html'
    })
    .when('/signup', {
      controller: 'MainController',
      templateUrl: '/signup.html'
    })
    .when('/login', {
      controller: 'MainController',
      templateUrl: '/login.html'
    })
    .when('/options', {
      controller: 'MainController',
      templateUrl: '/options.html'
    })
    .when('/delivery', {
      controller: 'MainController',
      templateUrl: '/delivery.html'
    })
    .when('/thankyou', {
      controller: 'MainController',
      templateUrl: '/thankyou.html'
    })
    .when('/payment', {
      controller: 'MainController',
      templateUrl: '/payment.html'
    });
});

var API = 'http://localhost:3000';

// Ajax service calls - using promises
app.factory('backEnd', function($http) {
  return {
    getSignUp: function(data) {
      return $http({
        method: 'POST',
        url: API + '/signup',
        data: data
      });
    },
    getLogin: function(data) {
      return $http({
        method: 'POST',
        url: API + '/login',
        data: data
      });
    },
    getOptions: function() {
      return $http({
        method: 'GET',
        url: API + '/options'
      });
    }
  };
});

app.controller('MainController', function($http, $scope, backEnd, $cookies, $location) {

  backEnd.getOptions()
    .then(function(data) {
      $scope.data = data.data;
      console.log(data);
  });

  $scope.signUp = function() {
    var signUpInfo = {
      username: $scope.username,
      password: $scope.password
    };
    console.log('hello world');
    backEnd.getSignUp(signUpInfo)
    .then(function(res) {
      console.log(res);
    });
  };

  $scope.login = function() {
    var loginInfo = {
      username: $scope.username,
      password: $scope.password
    };
    console.log('hello world');
    backEnd.getLogin(loginInfo)
    .then(function(res) {
      $cookies.put('token', res.data.token);
      $location.path('/options');
      console.log(res);
    });
  };

  $scope.order = function(grind, quantity) {
    $cookies.put('grind', grind);
    $cookies.put('quantity', quantity);
    $location.path('/delivery');
  };



console.log(backEnd);
});

// app.run(function($rootScope, $location, $cookies) {
//   $rootScope.$on('$locationChangeStart', function(event, nextUrl, currentUrl) {
//
//   })
// });
