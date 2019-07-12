var app = angular.module("Jupiter.login", []);
app.controller("loginController", function($scope, $http, $window){
    $scope.rememberCheck = true;
    $scope.user = $window.localStorage.getItem('username');
    $scope.pass = $window.localStorage.getItem('password');
    console.log('user: ' + $scope.user + ' pass: ' + $scope.pass);

    $scope.execlogin = function() {
        $http.get('http://localhost:3000/users/').then(
            function success(response) {
              if(response.data[$scope.user] == $scope.pass && $scope.user != null){
                console.log('successful login');
                console.log('rememberCheck: ' + $scope.rememberCheck);
                if($scope.rememberCheck){
                    $window.localStorage.setItem('username', $scope.user);
                    $window.localStorage.setItem('password', $scope.pass);

                }
                $window.sessionStorage.user = $scope.user;
                $window.location.href = '/log/'+$scope.user;
                  //add user to log
              }else{
                alert('Incorrect username or password');
              }
            }
        ).catch(
            function(error) {
              console.log("ERROR: " + error);
            }
        )
  }

});
