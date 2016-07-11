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
    .when('/payment', {
      controller: 'PaymentController',
      templateUrl: '/payment.html'
    })
    .when('/thankyou', {
      controller: 'MainController',
      templateUrl: '/thankyou.html'
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

app.run(function($rootScope, $location, $cookies) {
  $rootScope.$on('$locationChangeStart', function(event, nextUrl, currentUrl) {
    var token = $cookies.get('token');
    nextUrl = nextUrl.split('/');
    nextUrl = nextUrl[nextUrl.length -1];
    if (!token && (nextUrl === 'options' || nextUrl === 'delivery' || nextUrl === 'payment')) {
      $cookies.put('urlRedirect', nextUrl);
      $location.path('/login');
    }
    if (!token) {
      $rootScope.userButton = true;
    } else {
      $rootScope.userButton = false;
    }
  });
});

app.service('userAddress', function() {
  var userData = {};
  this.saveData = function(data){
    this.userData = data;
  };
  this.getData = function(){
    return this.userData;
  };
});

app.controller('PaymentController', function($http, $scope, backEnd, userAddress, $cookies, $location) {
  var data = userAddress.getData();
  $scope.data = data;
  console.log(data);

  var grind = $cookies.get('grind');
  $scope.grind = grind;
  console.log(grind);
  var quantity = $cookies.get('quantity');
  console.log(quantity);
  $scope.quantity = quantity;
});

app.controller('MainController', function($http, $scope, backEnd, userAddress, $cookies, $location) {

  backEnd.getOptions()
    .then(function(data) {
      $scope.data = data.data;
      console.log(data);
  });

  $scope.saveUserInfo = function() {
    userAddress.saveData({
      name: $scope.name,
      address1: $scope.address1,
      address2: $scope.address2,
      city: $scope.city,
      state: $scope.state,
      zipcode: $scope.zipcode,
      date: $scope.date
    });
    $location.path('/payment');
    console.log(userAddress.getData());
  };

  $scope.signUp = function() {
    var signUpInfo = {
      username: $scope.username,
      password: $scope.password
    };
    console.log('hello world');
    backEnd.getSignUp(signUpInfo)
    .then(function(res) {
      $location.path('/options');
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
      var nextUrl = $cookies.get('urlRedirect');
      if (!nextUrl) {
        $location.path('/options');
      } else {
        $location.path('/' + nextUrl);
        $cookies.remove('urlRedirect');
      }
      console.log(res);
    });
  };

  $scope.order = function(grind, quantity) {
    $cookies.put('grind', grind);
    $cookies.put('quantity', quantity);
    $location.path('/delivery');
  };

  $scope.logout = function() {
    $cookies.remove('token');
    $location.path('/');
  };



console.log(backEnd);
});
