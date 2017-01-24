'use strict';
(function() {
  angular.module("app")
    .component("garden", {
      templateUrl: "js/garden/garden.template.html",
      controller: controller
    });

  controller.$inject = ["$http", "$state", "$stateParams", 'ModalService'];

  function controller($http, $state, $stateParams, ModalService) {
    const vm = this;


    vm.$onInit = function() {
      $http.get('/api/plots').then(function(result) {
        var plots = [];
        for (let i = 0; i < result.data.length; i++) {
          if (result.data[i].farm === $stateParams.gardenName) {
            plots.push(result.data[i]);
          }
        }
        //Set the map
        vm.map = $stateParams.gardenName;
        console.log(vm.map);

        // var $p1 = angular.element('#p1').children();
        // console.log($p1);

        // Get all SVG clusters for each plot and add cluster to object reference
        for (let i = 0; i < plots.length; i++) {
          //TODO MAKE SEED FOR EACH PLOT IN THIS GARDEN OTHERWISE IT WILL BE NULL
          plots[i].svgCluster = angular.element('#p'+i).children();
        }

        var promiseArr = [];
        // Add an array of produce data to the plot and populate it
        for (let i = 1; i <= plots.length; i++) {
          // Make a promise all for this
          let promise = $http.get(`api/producePlots/${i}`);
          // let promise = $http.get('/api/producePlots/'+i).then(function(results) {
          //   plots[i].produce = results.data.produce;
          //   console.log(results.data.produce[0]);
          //   if (results.data.produce[0]) {
          //
          //     let produceColor = results.data.produce[0].color;
          //     plots[i].svgCluster.attr("style",'fill:#' + produceColor);
          //   }
          // });
          promiseArr.push(promise);
        }

        Promise.all(promiseArr).then(results => {
          for (let i = 0; i < results.length; i++) {
            // console.log('plots', plots[i]);
            // console.log(results[i]);
            if (results[i].data) {
              let plotId = parseInt(results[i].data.plot_id) - 1;
              plots[plotId].produce = results[i].data.produce;

              // let produceColor = results[i].data.produce[0].color;
              // plots[plotId].svgCluster.attr("style",'fill:#' + produceColor);
            }
          }
          for (let i = 0; i < plots.length; i++) {
            // Right now we are only tracking 1 produce
            let produceColor = plots[i].produce[0].color;
            plots[i].svgCluster.attr("style",'fill:#' + produceColor);
          }
          console.log(plots);
          // for (var i = 0; i < results.length; i++) {
          //   plots[i].produce = results[i].data.produce;
          //   console.log(results.data.produce[0]);
          //   if (results.data.produce[0]) {
          //
          //     let produceColor = results.data.produce[0].color;
          //     plots[i].svgCluster.attr("style",'fill:#' + produceColor);
          //   }
          // }
        });
      });
    };

    // MODAL FUNCTIONALITY
    vm.selectPlot = function(plot_id) {
      ModalService.showModal({
        templateUrl: "js/garden/modal_plot.html",
        controller: function ($scope, $element, close) {
          // $scope.singlePlot = {};
          $http.get('/api/plots/'+plot_id).then(function(result) {
            $scope.singlePlot = result.data;
            // console.log("plot data", result.data);
            $http.get('/api/producePlots/'+plot_id).then(function(pData) {
              // console.log("produce data", pData.data);
              $scope.singlePlot.produce = [];
              for (var i = 0; i < pData.data.produce.length; i++) {
                // populate an array of key value pairs from the array of produce
                $scope.singlePlot.produce.push(pData.data.produce[i]);
              }
            });
          });

          // Get User Id for update priveladges
          $scope.getUID = function() {
            var UID = parseInt($.cookie('user_info'));
            // if(UID === $scope.singlePlot.user_id) {
            //   return true;
            // } else {
            //   return false;
            // }
            return true;
          };

          $scope.removeProduce = function(produce_id) {
            $http.delete(`/api/producePlots/${plot_id}/${produce_id}`).then(function(result) {
              console.log(result);
            });
          };

          $scope.addProduce = function() {
            console.log($scope.newProduce);
            // Make everything uppercase
            // Check produce DB to see if produce exists, if not add default produce url
            $http.get(`/api/produce`).then(function(result) {
              let newProduce = {};
              for (var i = 0; i < result.data.length; i++) {
                if (result.data[i].produce_name === $scope.newProduce) {
                  newProduce = {
                    produce_name: $scope.newProduce,
                    produce_image_url: result.data[i].produce_image_url,
                    produce_id: result.data[i].id,
                    plot_id: plot_id
                  };
                }
              }
              // If new produce is not populate, populate it now
              if (!newProduce.produce_name) {
                newProduce = {
                  produce_name: $scope.newProduce,
                  produce_image_url: "../../assets/icons/other_icon.svg"
                };
                // Add it to the produce table
                $http.post('/api/produce', newProduce).then(function(result) {
                  // create object with produce ID and plot ID
                  newProduce.produce_id = result.data[0].id;
                  newProduce.plot_id = plot_id;
                  $http.post('/api/producePlots', newProduce).then(function(pResult) {
                    console.log(pResult);
                    //update results
                  });
                });
              }
              else {
                $http.post('/api/producePlots', newProduce).then(function(result) {
                  console.log(result);
                  //update result
                });
              }
              // create object with produce ID and plot id
            });
          };

          $scope.myClose = function(result){
            $element.modal('hide');
            close(null, 500);
          };
        }
      }).then(function(modal) {
        modal.element.modal();
        modal.close.then(function(result) {
          // console.log("CLOSING MODAL AMIRITE?: ", result);
        });
      });
    };
  }
}());
