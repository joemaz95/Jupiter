var app = angular.module("Jupiter", ["angularjs-dropdown-multiselect", "ngMaterial", "chart.js"]);

app.controller("chartController", function($scope, $rootScope, $http) {
  var scope = this;
  //chart 1
  $scope.labels1 = ['20s', '30s', '40s', '50s', '60s', '70s', '80s', '90+'];
  $scope.series1 = ['Patients'];
  $scope.data1 = [
      [65, 59, 80, 81, 56, 55, 40, 34]
  ];
  $scope.options1 = {
      title: {
          display: true,
          text: 'Patient Age'
      },
      scales: {
          xAxes: [{
              ticks: {
                  fontSize: 8
              }
          }]
      },
      tooltips: {
          enabled: false
      }
  };
  //chart 2
  $scope.labels2 = ['\'07', '\'08', '\'09', '\'10', '\'11', '\'12', '\'13', '\'14'];
  $scope.series2 = ['Patients'];

  $scope.data2 = [
      [65, 59, 80, 81, 56, 55, 40, 34]
  ];
  $scope.options2 = {
      title: {
          display: true,
          text: 'Result Date'
      },
      scales: {
          xAxes: [{
              ticks: {
                  fontSize: 8
              }
          }]
      },
      tooltips: {
          enabled: false
      }
  };
  //chart 3
  $scope.labels3 = ['Male', 'Female', 'Other'];
  $scope.series3 = ['Patients'];

  $scope.data3 = [
      [65, 59, 80, 81, 56, 55, 40, 34]
  ];
  $scope.options3 = {
      title: {
          display: true,
          text: 'Patient Gender'
      },
      scales: {
          xAxes: [{
              ticks: {
                  fontSize: 8
              }
          }]
      },
      tooltips: {
          enabled: false
      }
  };
  //chart 4
  $scope.labels4 = ['Radiology', 'Pathology', 'Other'];
  $scope.series4 = ['Patients'];

  $scope.data4 = [
      [65, 59, 80, 81, 56, 55, 40, 34]
  ];
  $scope.options4 = {
      title: {
          display: true,
          text: 'Result Type'
      },
      scales: {
          xAxes: [{
              ticks: {
                  fontSize: 8
              }
          }]
      },
      tooltips: {
          enabled: false
      }
  };

  //same color scheme for all charts
  $scope.colors = [{
      backgroundColor:"#EAF1F5",
      hoverBackgroundColor:"#D3D3D3",
      borderColor:"#97BBCD",
      hoverBorderColor:"#97BBCD"
    }];

  $scope.data1[0] = [];
  $scope.data2[0] = [];
  $scope.data3[0] = [];
  $scope.data4[0] = [];

  $http.get('http://localhost:3000/data/').then(
    function success(response) {
        for(var i = 0; i < 8; i++){
            if(i < 8){
                $scope.data1[0].push(response.data[0][i]);
            }
            if(i < 10){
                $scope.data2[0].push(response.data[1][i]);
            }
            if(i < 3){
                $scope.data3[0].push(response.data[2][i]);
            }
            if(i < 3){
                $scope.data4[0].push(response.data[3][i]);
            }
        }
    }
).catch(
    function(error) {
        console.log("ERROR: " + error);
    }
  );


    $scope.onClick = function (points, evt, barClicked) {
        try {
            var barIndex = points[0]._index;
            var chartTitle = barClicked._chart.config.options.title.text;
            var gender;
            var lowerAge;
            var upperAge;
            switch (chartTitle) {
                case 'Patient Age'://index of the bar you click determines what 10 year age group to focus on
                    lowerAge = (barIndex + 2) * 10;
                    upperAge = lowerAge + 9;
                    break;
                case 'Result Date':
                    //TODO
                    break;
                case 'Patient Gender'://1male 2female 3other
                    gender = barIndex + 1;//as the gender_opt in the search controller starts at 1
                    break;
                case 'Result Type':
                    //TODO
                    break;
                default:
                    break;
            }
            //need to pass the title to know what field is being changed (gender, age, date, type) ie what chart is getting clicked
            $rootScope.$emit("callExecSearch", {
                chartTitle: chartTitle/*, refineSearchString:refineSearchString*/,
                gender: gender,
                lowerAge: lowerAge,
                upperAge: upperAge
            });
        }catch(e){//clicked on chart but not a bar
            console.error('ERROR: ' + e);
        }
    };
  displayCharts();

});

app.controller("searchController", function($scope, $http, $window, $rootScope) {

    $rootScope.$on("callExecSearch", function(event, dataFromChart){
        $scope.execsearch(dataFromChart);
    });

  $scope.execsearch = function(dataFromChart) {
    $scope.areResults = false;
    $scope.currentpage = 1;
    var sort_by;
    var direction;
    var gender;
    var age_condition;
    var age;
    var doc_type;
    var url = "";

    var chartTitle;
    var chartGender;
    var chartLowerAge;
    var chartUpperAge;
    if(dataFromChart != undefined){
        chartTitle = dataFromChart.chartTitle;
        chartGender = dataFromChart.gender;
        chartLowerAge = dataFromChart.lowerAge;
        chartUpperAge = dataFromChart.upperAge;
    }

    if ($scope.DSLmode == true) {
      url = "http://localhost:8800/execsearch/kdsl?q=" + $scope.query.replace(/&/g, "AND");
    }
    else {
      var sort_option;
      if ($scope.sortby_model.length == 0) {
        sort_option = 0;
      }
      else {
        sort_option = $scope.sortby_model[0].id;
      }

      switch (sort_option) {
        case 1:
          sort_by = "age_now";
          break;
        case 2:
          sort_by = "age_at_event";
          break;
        case 3:
          sort_by = "document_created_at";
          break;
        default:
          sort_by = "none";
      }

      var dir_option;
      if ($scope.dir_model.length == 0) {
        dir_option = 0;
      }
      else {
        dir_option = $scope.dir_model[0].id;
      }

      switch (dir_option) {
        case 1:
          direction = "asc";
          break;
        case 2:
          direction = "desc";
          break;
        default:
          direction = "none";
          break;
      }

      var gender_opt;
      if ($scope.gender_model.length == 0) {
        gender_opt = 0;
      }
      else {
        gender_opt = $scope.gender_model[0].id;
      }

      if(chartGender != null) {
        gender_opt = chartGender;
      }

      switch (gender_opt) {
        case 1:
          gender = "male";
          break;
        case 2:
          gender = "female";
          break;
        default:
          gender = "none";
      }

      if(chartGender != null){
          $scope.gender_model[0] = $scope.gender_fields[gender_opt - 1];
          $scope.final_gender = gender;
      }

      if ($scope.age_model.length == 0) {
        age_condition = "none";
      }
      else {
        age_condition = $scope.age_model[0].label;
        console.log($scope.age_model)
      }

      if(chartLowerAge && chartUpperAge){
        $scope.age_model[0] = $scope.age_fields[2];
          age_condition = "Between";
          $scope.age_input = chartLowerAge;
          $scope.between_input = chartUpperAge;
      }

      if ($scope.doc_model.length == 0) {
        doc_type = "none";
      }
      else {
        doc_type = $scope.doc_model[0].label;
      }



      url = 'http://localhost:8800/execsearch/' + $scope.query.replace(" ", "_") + "?";

      url += "from=" + $scope.results_start_point;

      if (sort_by !== "none") {
        url += ("&sort=" + sort_by);
        if (direction !== "none") {
          url += ("&dir=" + direction);
        }
      }

      //rest of fields, check if first field has been added to know if & or not
      if (gender !== "none") {
          // if(chartTitle != "Patient Gender") {//only set this if not being changed by clicking the chart
              url += ("&gender=" + gender);

              if($scope.gender_model != "") {
                  $scope.final_gender = $scope.gender_model[0].label;
              }
          // }
      }
      else {
        $scope.final_gender = "";
      }

      //for now its going to just be age_now, can add other possibilies in future
      if (age_condition !== "none") {
              //check for negatives depending on kamioka
              if ($scope.age_input == null) {
                  //stop search say need to enter age number if desired
                  alert("Must enter age");
                  return;
              }
              else {
                  url += ("&age_condition=" + age_condition);
                  url += ("&age_entered=" + $scope.age_input);

                  $scope.final_age_opt = age_condition;
                  $scope.final_age_input = $scope.age_input;
                  if (age_condition === "Between") {
                      if ($scope.between_input == null && chartLowerAge == null) {
                          alert("Must enter age range");
                          return;
                      }
                      url += ("&between=" + $scope.between_input);
                      $scope.final_between_input = $scope.between_input;
                  }
                  else {
                      $scope.final_between_input = "";
                  }
              }
      }
      else {
        $scope.final_age_opt = "";
        $scope.final_age_input = "";
      }

      if (doc_type !== "none") {
        url += ("&doctype=" + doc_type);
        first_field = true;
      }

        if ($scope.patient_root != null) {
          url += "&proot=" + $scope.patient_root;
          if ($scope.patient_ext != null) {
            url += "&pext=" + $scope.patient_ext;
          }
        }

      console.log(url);
    }

    $scope.final_query = $scope.query;
    $scope.search_history.push({query: $scope.final_query, url: url});
    $scope.current_entry++;

    $http.get(url).then(
      function success(response) {
        console.log(response);
        $scope.results = response;
        $scope.areResults = true;
      }, function error(response) {
        console.log(response);
        if(response != null && response.data != null) {
          alert("Invalid query: " + response.data.error);
        }
        else {
          alert("Invalid query:" + response);
        }
    });
  };

  //sort by dropdown fields
  $scope.sort_fields = [ {id: 1, label: "Age now"}, {id: 2, label: "Age at event"}, {id: 3, label: "Document created"} ];
  $scope.sortby_model = [ ];
  $scope.drop_down_settings = {checkBoxes: false, showEnableSearchButton: false, showCheckAll: false, showUncheckAll: false, styleActive: true,
    selectionLimit: 1, smartButtonMaxItems: 1, smartButtonTextConverter: function(itemText, originalItem) {return itemText;}};
  $scope.sort_translation = {buttonDefaultText: "Sort By"};
  $scope.drop_down_events = {onSelectionChanged: $scope.execsearch};

  //direction dropdown, consider radio button alternative
  $scope.dir_fields = [ {id: 1, label: "Ascending"}, {id: 2, label: "Descending"} ];
  $scope.dir_model = [ ];
  $scope.dir_translation = {buttonDefaultText: "Direction"};

  //gender dropdown fields
  $scope.gender_fields = [ {id: 1, label: "Male"}, {id: 2, label: "Female"}, {id: 3, label: "Other"} ];
  $scope.gender_model = [ ];
  $scope.gender_translation = {buttonDefaultText: "Gender"};

  //age dropdown fields
  $scope.age_fields = [ {id: 1, label: "Over"}, {id: 2, label: "Under"}, {id: 3, label: "Between"} ];
  $scope.age_model = [ ];
  $scope.age_translation = {buttonDefaultText: "Age"};

  //document type fields
  $scope.doc_fields = [ {id: 1, label: "pdf"}, {id: 1, label: "rst"}, {id: 1, label: "txt"} ];
  $scope.doc_model = [ ];
  $scope.doc_translation = {buttonDefaultText: "File Type"};

  $scope.loggedIn = $window.sessionStorage.user;

  $scope.DSLmode = false;
  $scope.show_graph = true;

  $scope.next_page = function() {
    //if we are on page 5, 10, etc (need a new set of pages)
    if($scope.currentpage % 5 == 0) {
      //make new results start at next results in series
      $scope.results_start_point += ($scope.RES_PER_PAGE * 5);
      //change page numbers at the bottom
      $scope.page_set += 5;
      $scope.execsearch();
      //start on first page of new results
      $scope.currentpage = 1;
    }
    else {
      //regular page increment
      $scope.currentpage++;
    }
  }
  //add check to make sure no negatives
  $scope.prev_page = function() {
    //same as next page when moving back to an old set of pages
    if($scope.results_start_point > 0 && $scope.currentpage % 5 == 1) {
      $scope.results_start_point -= ($scope.RES_PER_PAGE * 5);
      $scope.page_set -= 5;
      $scope.execsearch();
      $scope.currentpage = 5;
    }
    else if($scope.currentpage != 1) {
      //regular page decrement
      $scope.currentpage--;
    }
  }

  $scope.set_page = function(pg) {
    $scope.currentpage = pg;
  }

  $scope.RES_PER_PAGE = 7;
  $scope.results_start_point = 0;
  $scope.page_set = 0;

  $scope.search_history = [];
  $scope.current_entry = -1;

});


app.controller("autoSearch", function($rootScope) {
  var vm = this;
  vm.healthData = loadAll();
  vm.selectedItem = null;
  vm.searchText = null;
  vm.qsearch = qsearch;
  $rootScope.autoquery = vm.searchText;

  function qsearch(query) {
    var results = query ? vm.healthData.filter( createFilterFor(query) ) : vm.healthData;
    $rootScope.autoquery = query;
    return results;
  }

  function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(term) {
        return (term.value.indexOf(lowercaseQuery) === 0);
      };

    }
})

function loadAll() {
      var allTerms = 'Health, Terms, Here';

      return allTerms.split(/, +/g).map( function (term) {
        return {
          value: term.toLowerCase(),
          display: term
        };
      });
    }

app.filter("trust", function($sce) {
  return function(htmltext) {
    return $sce.trustAsHtml(htmltext);
  }
});

//toggle dropdown menu when the account button is clicked
function toggleDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

//close the dropdown menu when the screen is clicked elsewhere
window.onclick = function(event) {
  console.log('onclick');
    if (!(event.target.matches('.profileButton') || event.target.matches('.nameHalfOfButton') || event.target.matches('.dropdownArrow')|| event.target.matches('.accountDropdown'))) {

        var dropdowns = document.getElementsByClassName("accountDropdown");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

function displayCharts() {
  document.getElementsByClassName("charts")[0].style.display = "block";
}
