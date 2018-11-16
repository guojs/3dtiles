 Cesium.Ion.defaultAccessToken =
     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0N2QyYjE1Ny1jZjZlLTQ3YjgtODg0MC03N2Q4YTBiZGQyNzUiLCJpZCI6Mzk0Niwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTUzOTMyNjI0MX0.GFXKtJMElRHDp8iF1BN7lA_AhiiD_a6eZCJeLGlWhp0';

 $('#infobox').hide();
 $('#bInfo').hide();
 var areaEntiy = {};
 var selectedEntity = {}; //当前选中的Entity
 var buildHandler = {},
     houseHandler = {};

 var pointLabel = [
     119.478909294433, 35.435140258812794, 52,
     119.47820914078821, 35.435064778526204, 52,
     119.47754836863878, 35.435066326613835, 52,
     119.47682121947636, 35.43503889966242, 52,
     119.47607867526494, 35.43503676586316, 52,
     119.47607995894941, 35.435543673794925, 52,
     119.47682329892008, 35.435531949575356, 52,
     119.47757227424889, 35.43554612195167, 52,
     119.47826670889319, 35.4355400799478, 60,
     119.47892620712436, 35.435534166825164, 60,
     119.47782971496913, 35.436162684902506, 80,
     119.47690149917251, 35.4361517318285, 80,
     119.47612118997836, 35.43613962637061, 80,
     119.4762240513387, 35.43684997432241, 80
 ]


 var viewer = new Cesium.Viewer('cesiumContainer', {
     fullscreenButton: false,
     // navigationHelpButton: false,
     selectionIndicator: false,
     // sceneMode : Cesium.SceneMode.COLUMBUS_VIEW,
     homeButton: false,
     //  shadows: true,
     //  globe: false,
     sceneModePicker: false,
     // clockViewModel:false,
     navigationHelpButton: false,
     infoBox: false,
     scene3DOnly: false,
     geocoder: false,
     timeline: false,
     baseLayerPicker: false,
     targetFrameRate: 30,
     navigationInstructionsInitiallyVisible: false,
     terrainProvider: new Cesium.CesiumTerrainProvider({
         url: Cesium.IonResource.fromAssetId(1)
     })

 });

 viewer.scene.globe.depthTestAgainstTerrain = true;
 viewer._cesiumWidget._creditContainer.style.display = "none";



 var xtm = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
     maximumMemoryUsage: 2024,
     maximumScreenSpaceError: 1,
     url: 'http://192.168.0.218:8003/tileset.json',
     maximumNumberOfLoadedTiles: 1000000 // Temporary workaround for low memory mobile devices - Decrease (disable) tile cache.
 }));
 xtm.readyPromise.then(function(tileset) {
     var cartographic = new Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
     var surface = new Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0);
     var offset = new Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 8);
     var translation = new Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
     tileset.modelMatrix = new Cesium.Matrix4.fromTranslation(translation);
     console.log('xtm tileReady');
 }).otherwise(function(arg) {
     console.log(arg);
 });

 viewer.zoomTo(xtm, new Cesium.HeadingPitchRange(0, -0.5, 0));

 function loadBuildJson() {
     if (houseHandler && houseHandler.destroy) houseHandler.destroy();
     var entities = [];
     var promise = Cesium.GeoJsonDataSource.load('/house.topojson');
     promise.then(function(dataSource) {
         //  viewer.dataSources.add(dataSource);
         entities = dataSource.entities.values;
         for (var i = 0; i < entities.length; i++) {
             var entity = entities[i];
             entity.type = 'buildInfo';
             entity.attributes = entity.properties;
             entity.polygon.material = Cesium.Color.fromAlpha(Cesium.Color['yellow'.toUpperCase()], parseFloat(0.005));
             entity.polygon.outline = false;
             entity.polygon.extrudedHeight = entity.properties.baseHeight._value + entity.properties.buildHeigh._value;
             entity.polygon.height = entity.properties.baseHeight._value;
             viewer.entities.add(entity);
         }
     }).otherwise(function(error) {});

     buildHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
     buildHandler.setInputAction(function(movement) {
         var entity = viewer.scene.pick(movement.position);
         if (entity && entity.id) {
             entity.id.polygon.material = Cesium.Color.fromAlpha(Cesium.Color['yellow'.toUpperCase()], parseFloat(0.35));
             selectedEntity = entity;
             $('#bInfo').show();
         } else if (selectedEntity && selectedEntity.id) {
             $('#bInfo').hide();
             selectedEntity.id.polygon.material = Cesium.Color.fromAlpha(Cesium.Color['yellow'.toUpperCase()], parseFloat(0.01));
         }

     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 }

 function loadfamilyhouse() {
     $('#bInfo').hide();
     if (buildHandler && buildHandler.destroy) buildHandler.destroy();
     var promise = Cesium.GeoJsonDataSource.load('/family-house.topojson');
     promise.then(function(dataSource) {
         var entities = dataSource.entities.values;
         let length = entities.length;
         for (let i = 0; i < length; i++) {
             let entity = entities[i];
             let positions = entity.polygon.hierarchy._value.positions;
             let coordinates = [];
             for (var k = 0; k < positions.length; k++) {
                 var cartographic = Cesium.Cartographic.fromCartesian(positions[k]);
                 var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                 var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                 var heightString = cartographic.height;
                 coordinates.push(longitudeString);
                 coordinates.push(latitudeString);
             }
             console.log(coordinates)
             var baseHeight = entity.properties.getValue().baseHeight;
             var heightAry = entity.properties.getValue().levHeiAry.split(',');
             for (let j = 0; j < entity.properties.getValue().level; j++) {
                 viewer.entities.add({
                     polygon: {
                         hierarchy: Cesium.Cartesian3.fromDegreesArray(coordinates),
                         extrudedHeight: baseHeight + Number.parseFloat(heightAry[j]),
                         height: baseHeight,
                         material: Cesium.Color.fromRandom({
                             minimumRed: 0.75,
                             minimumGreen: 0.75,
                             minimumBlue: 0.75,
                             alpha: 0.05
                         }),
                         closeTop: true,
                         closeBottom: false
                     },
                     type: 'houseInfo',
                     attributes: entity.properties,
                     level: j
                 })
                 baseHeight += Number.parseFloat(heightAry[j]);
             }
         }
     }).otherwise(function(error) {
         console.log(error);
     });

     houseHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
     houseHandler.setInputAction(function(movement) {
         var entity = viewer.scene.pick(movement.position);
         if (selectedEntity.id) {
             selectedEntity.id.polygon.material = Cesium.Color.fromAlpha(Cesium.Color['yellow'.toUpperCase()], parseFloat(0.01));
         }
         infoHide();
         if (entity && entity.id) {
             entity.id.polygon.material = Cesium.Color.fromAlpha(Cesium.Color['yellow'.toUpperCase()], parseFloat(0.35));
             selectedEntity = entity;
             infoShow();
         }
     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 }

 //添加标注
 function loadLable() {
     for (var i = 0; i < pointLabel.length; i++) {
         viewer.entities.add({
             position: Cesium.Cartesian3.fromDegrees(pointLabel[3 * i], pointLabel[3 * i + 1], pointLabel[3 * i + 2]),
             type: 'PointLabel',
             label: {
                 text: '香河佳园' + (i + 1) + '栋',
                 fontWeight: 'bold',
                 font: '16px sans-serif',
                 scaleByDistance: new Cesium.NearFarScalar(5, 2, 5000, 0.0),
                 distanceDisplayCondition: new Cesium.DistanceDisplayCondition(5, 5000),
                 fillColor: Cesium.Color.RED,
                 pixelOffset: new Cesium.Cartesian2(0, -30), // default: (0, 0)
                 eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
                 horizontalOrigin: Cesium.HorizontalOrigin.CENTER, // default
                 heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
             }
         });
     }

 }

 ////////////////////info show//////////////////////////

 function infoShow() {
     $('#infobox').show(3000);
 }

 function infoHide() {
     $('#infobox').hide();
 }

 $('#menu a').on('click', function() {
     if ($(this)[0].id == 'buildInfo') {
         removeEntityByType('houseInfo');
         removeEntityByType('tump');
         removeEntityByType('safeMonitor');
         loadBuildJson();
         infoHide()
     } else if ($(this)[0].id == 'houseInfo') {
         removeEntityByType('buildInfo');
         removeEntityByType('tump');
         removeEntityByType('safeMonitor');
         loadfamilyhouse();
     } else if ($(this)[0].id == 'tumple') {
         removeEntityByType('buildInfo');
         removeEntityByType('houseInfo');
         removeEntityByType('safeMonitor');
         loadTumple();
     } else if ($(this)[0].id == 'safe') {
         removeEntityByType('buildInfo');
         removeEntityByType('houseInfo');
         removeEntityByType('tump');
         addSafeMonitor();
     }
     $('#menu a').each(function() {
         $(this).removeClass('select');
     })
     $(this).toggleClass('select');
 })

 $('.info-header a').on('click', function() {
     var _this = this;
     $('.info-header a').each(function() {
         $(this).removeClass('select');
     })
     $(this).toggleClass('select');
     $('.info-content').each(function() {
         $(this).css('display', 'none');
         if ($(this).data('item') == $(_this).data('item')) {
             $(this).css('display', 'block');
         }
     })
 })

 $('#shade').on('change', function() {
     if ($(this)[0].checked) {
         viewer.shadows = true;
     } else {
         viewer.shadows = false;
     }
 })
 $('#buildLabel').on('change', function() {
     if ($(this)[0].checked) {
         loadLable();
     } else {
         removeEntityByType('PointLabel');
     }
 })

 //添加管廊
 function loadTumple(params) {

     function computeCircle(radius) {
         var positions = [];
         for (var i = 0; i < 360; i++) {
             var radians = Cesium.Math.toRadians(i);
             positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
         }
         return positions;
     }
     var tumple = viewer.entities.add({
         type: 'tump',
         name: '市政自来水管网',
         polylineVolume: {
             vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
             positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                 119.47961192344887, 35.43794773080938, 32,
                 119.47960668855006, 35.43585763387818, 32,
                 119.47717010985585, 35.435806833954395, 32,
                 119.47709496655912, 35.4358949958753, 32,
                 119.47578819569249, 35.435876613273614, 32
             ]),
             shape: computeCircle(1.0),
             // cornerType : Cesium.CornerType.BEVELED,
             // material : Cesium.Color.GREEN.withAlpha(0.5),
             // outline : true,
             // outlineColor : Cesium.Color.Blue,
             material: new Cesium.Material({
                 fabric: {
                     type: 'Water',
                     uniforms: {
                         // specularMap: '../images/earthspec1k.jpg',
                         normalMap: Cesium.buildModuleUrl('/img/waterNormals.jpg'),
                         frequency: 10000.0,
                         animationSpeed: 0.01,
                         amplitude: 1.0
                     }
                 }
             })
             // material: new Cesium.ImageMaterialProperty({
             //     image:'/img/iron.jpg',
             //     repeat : new Cesium.Cartesian2(20000,28000)
             // })
         }
     });
      //#endregion
      var color = Cesium.Color.fromRandom();
      var burstSize = 400.0;
      var lifetime = 10.0;
      var bursts=[];

      var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(119.47754836863878, 35.435066326613835));
      var emitterInitialLocation = new Cesium.Cartesian3(0.0, 0.0, 100.0);
      var emitterModelMatrixScratch = new Cesium.Matrix4();
      var xMin = -100.0;
var xMax = 100.0;
var yMin = -80.0;
var yMax = 100.0;
var zMin = -50.0;
var zMax = 50.0;
      var x = Cesium.Math.randomBetween(xMin, xMax);
      var y = Cesium.Math.randomBetween(yMin, yMax);
      var z = Cesium.Math.randomBetween(zMin, zMax);

      var offset = new Cesium.Cartesian3(x, y, z);
      var position = Cesium.Cartesian3.add(emitterInitialLocation, offset, new Cesium.Cartesian3());
      var emitterModelMatrix = Cesium.Matrix4.fromTranslation(position, emitterModelMatrixScratch);
     
      for (var j = 0; j < 3; ++j) {
        bursts.push(new Cesium.ParticleBurst({
            time : Cesium.Math.nextRandomNumber() * 5,
            minimum : burstSize,
            maximum : burstSize
        }));
    }
    
var minimumExplosionSize = 30.0;
var maximumExplosionSize = 100.0;
    var particleToWorld = Cesium.Matrix4.multiply(modelMatrix, emitterModelMatrix, new Cesium.Matrix4());
    var worldToParticle = Cesium.Matrix4.inverseTransformation(particleToWorld, particleToWorld);
    var particlePositionScratch = new Cesium.Cartesian3();
    
    var size = Cesium.Math.randomBetween(minimumExplosionSize, maximumExplosionSize);
    var force = function(particle) {
        var position = Cesium.Matrix4.multiplyByPoint(worldToParticle, particle.position, particlePositionScratch);
        if (Cesium.Cartesian3.magnitudeSquared(position) >= size * size) {
            Cesium.Cartesian3.clone(Cesium.Cartesian3.ZERO, particle.velocity);
        }
    };
     viewer.scene.primitives.add(new Cesium.ParticleSystem({
        image : 'img/fire.png',
        startColor : color,
        endColor : color.withAlpha(0.0),
        particleLife : 20,
        speed : 100.0,
        imageSize :  new Cesium.Cartesian2(7.0, 7.0),
        emissionRate : 0,
        emitter : new Cesium.SphereEmitter(0.1),
        bursts : bursts,
        lifetime : lifetime,
        updateCallback : force,
        modelMatrix : modelMatrix,
        emitterModelMatrix : emitterModelMatrix
    }));
















 }


 function removeEntityByType(type) {
     var delEntities = [];
     viewer.entities.values.forEach(item => {
         if (item.type == type) {
             delEntities.push(item);
         }
     })
     for (var i = 0; i < delEntities.length; i++) {
         viewer.entities.remove(delEntities[i]);
     }
 }

 //****************************测量空间面积************************************************//
 $('#toolArea').on('click', function() {
     if (viewer.entities.contains(areaEntiy)) {
         viewer.entities.remove(areaEntiy);
     }
     measureAreaSpace(viewer, {});
 })

 var measureAreaSpace = function(viewer, handler) {
     handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
     var positions = [];
     var tempPoints = [];
     var polygon = null;
     var tooltip = document.getElementById("toolTip");
     var cartesian = null;
     var floatingPoint; //浮动点
     handler.setInputAction(function(movement) {
         tooltip.style.left = movement.endPosition.x + 3 + "px";
         tooltip.style.top = movement.endPosition.y - 25 + "px";
         tooltip.innerHTML = '<p>单击开始，双击结束</p>';
         cartesian = viewer.scene.pickPosition(movement.endPosition);
         //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
         if (positions.length >= 2) {
             if (!Cesium.defined(polygon)) {
                 polygon = new PolygonPrimitive(positions);
             } else {
                 positions.pop();
                 positions.push(cartesian);
             }
         }
     }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

     handler.setInputAction(function(movement) {
         tooltip.style.display = "none";
         cartesian = viewer.scene.clampToHeight(viewer.scene.pickPosition(movement.position));

         // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
         if (positions.length == 0) {
             positions.push(cartesian.clone());
         }
         //positions.pop();
         positions.push(cartesian);
         //在三维场景中添加点
         var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
         var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
         var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
         var heightString = cartographic.height;
         tempPoints.push({
             lon: longitudeString,
             lat: latitudeString,
             hei: heightString
         });

         console.log(longitudeString + ',' + latitudeString)
         //  floatingPoint = viewer.entities.add({
         //      name: '多边形面积',
         //      position: positions[positions.length - 1],
         //      point: {
         //          pixelSize: 5,
         //          color: Cesium.Color.RED,
         //          outlineColor: Cesium.Color.WHITE,
         //          outlineWidth: 2,
         //          heightReference: Cesium.HeightReference.none
         //      }
         //  });
     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

     handler.setInputAction(function(movement) {
         handler.destroy();
         positions.pop();
         //tempPoints.pop();
         viewer.entities.remove(floatingPoint);
         tooltip.style.display = "none";
         //在三维场景中添加点
         // var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
         // var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
         // var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
         // var heightString = cartographic.height;
         // tempPoints.push({ lon: longitudeString, lat: latitudeString ,hei:heightString});

         var textArea = getArea(tempPoints) + "平方公里";
         areaEntiy = viewer.entities.add({
             name: '多边形面积',
             position: viewer.scene.clampToHeight(positions[positions.length - 1]),
             // point : {
             // 	pixelSize : 5,
             // 	color : Cesium.Color.RED,
             // 	outlineColor : Cesium.Color.WHITE,
             // 	outlineWidth : 2,
             // 	heightReference:Cesium.HeightReference.CLAMP_TO_GROUND 
             // },
             label: {
                 text: textArea,
                 font: '18px sans-serif',
                 fillColor: Cesium.Color.GOLD,
                 style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                 outlineWidth: 2,
                 verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                 pixelOffset: new Cesium.Cartesian2(20, -40)
             }
         });
     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

     var radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad) 
     var degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度

     //计算多边形面积
     function getArea(points) {
         var a = JSON.stringify(points);

         var res = 0;
         //拆分三角曲面
         for (var i = 0; i < points.length - 2; i++) {
             var j = (i + 1) % points.length;
             var k = (i + 2) % points.length;
             var totalAngle = Angle(points[i], points[j], points[k]);
             var dis_temp1 = distance(positions[i], positions[j]);
             var dis_temp2 = distance(positions[j], positions[k]);
             res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
         }


         return (res / 1000000.0).toFixed(4);
     }

     /*角度*/
     function Angle(p1, p2, p3) {
         var bearing21 = Bearing(p2, p1);
         var bearing23 = Bearing(p2, p3);
         var angle = bearing21 - bearing23;
         if (angle < 0) {
             angle += 360;
         }
         return angle;
     }
     /*方向*/
     function Bearing(from, to) {
         var lat1 = from.lat * radiansPerDegree;
         var lon1 = from.lon * radiansPerDegree;
         var lat2 = to.lat * radiansPerDegree;
         var lon2 = to.lon * radiansPerDegree;
         var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) *
             Math.cos(lat2) * Math.cos(lon1 - lon2));
         if (angle < 0) {
             angle += Math.PI * 2.0;
         }
         angle = angle * degreesPerRadian; //角度
         return angle;
     }

     var PolygonPrimitive = (function() {
         function _(positions) {
             this.options = {
                 name: '多边形',
                 polygon: {
                     hierarchy: [],
                     perPositionHeight: true,
                     material: Cesium.Color.GREEN.withAlpha(0.5)
                 }
             };

             this.hierarchy = positions;
             this._init();
         }

         _.prototype._init = function() {
             var _self = this;
             var _update = function() {
                 return _self.hierarchy;
             };
             //实时更新polygon.hierarchy
             this.options.polygon.hierarchy = new Cesium.CallbackProperty(_update, false);
             viewer.entities.add(this.options);
         };

         return _;
     })();

     function distance(point1, point2) {
         var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
         var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
         /**根据经纬度计算出距离**/
         var geodesic = new Cesium.EllipsoidGeodesic();
         geodesic.setEndPoints(point1cartographic, point2cartographic);
         var s = geodesic.surfaceDistance;
         //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
         //返回两点之间的距离
         s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
         return s;
     }
 };

 //  initDrawHelper(viewer);

 function initDrawHelper(viewer) {
     var scene = viewer.scene;
     var drawHelper = new DrawHelper(viewer);
     var toolbar = drawHelper.addToolbar(document.getElementById("toolbar"), {
         buttons: ['marker', 'polyline', 'polygon', 'circle', 'extent']
     });
     toolbar.addListener('markerCreated', function(event) {
         loggingMessage('Marker created at ' + event.position.toString());
         // create one common billboard collection for all billboards
         var b = new Cesium.BillboardCollection();
         scene.primitives.add(b);
         var billboard = b.add({
             show: true,
             position: viewer.scene.clampToHeight(event.position, []),
             pixelOffset: new Cesium.Cartesian2(0, 0),
             eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
             horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
             verticalOrigin: Cesium.VerticalOrigin.CENTER,
             scale: 1.0,
             image: './img/glyphicons_242_google_maps.png',
             color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
         });
         billboard.setEditable();
     });
     toolbar.addListener('polylineCreated', function(event) {
         loggingMessage('Polyline created with ' + event.positions.length + ' points');
         var polyline = new DrawHelper.PolylinePrimitive({
             positions: event.positions,
             width: 5,
             geodesic: true
         });
         scene.primitives.add(polyline);
         polyline.setEditable();
         polyline.addListener('onEdited', function(event) {
             loggingMessage('Polyline edited, ' + event.positions.length + ' points');
         });

     });
     toolbar.addListener('polygonCreated', function(event) {
         loggingMessage('Polygon created with ' + event.positions.length + ' points');
         var polygon = new DrawHelper.PolygonPrimitive({
             positions: event.positions,
             material: Cesium.Material.fromType('Checkerboard')
         });
         scene.primitives.add(polygon);
         polygon.setEditable();
         polygon.addListener('onEdited', function(event) {
             loggingMessage('Polygon edited, ' + event.positions.length + ' points');
         });

     });
     toolbar.addListener('circleCreated', function(event) {
         loggingMessage('Circle created: center is ' + event.center.toString() + ' and radius is ' + event.radius.toFixed(1) + ' meters');
         var circle = new DrawHelper.CirclePrimitive({
             center: event.center,
             radius: event.radius,
             material: Cesium.Material.fromType(Cesium.Material.RimLightingType)
         });
         scene.primitives.add(circle);
         circle.setEditable();
         circle.addListener('onEdited', function(event) {
             loggingMessage('Circle edited: radius is ' + event.radius.toFixed(1) + ' meters');
         });
     });
     toolbar.addListener('extentCreated', function(event) {
         var extent = event.extent;
         loggingMessage('Extent created (N: ' + extent.north.toFixed(3) + ', E: ' + extent.east.toFixed(3) + ', S: ' + extent.south.toFixed(3) + ', W: ' + extent.west.toFixed(3) + ')');
         var extentPrimitive = new DrawHelper.ExtentPrimitive({
             extent: extent,
             material: Cesium.Material.fromType(Cesium.Material.StripeType)
         });
         scene.primitives.add(extentPrimitive);
         extentPrimitive.setEditable();
         extentPrimitive.addListener('onEdited', function(event) {
             loggingMessage('Extent edited: extent is (N: ' + event.extent.north.toFixed(3) + ', E: ' + event.extent.east.toFixed(3) + ', S: ' + event.extent.south.toFixed(3) + ', W: ' + event.extent.west.toFixed(3) + ')');
         });
     });

     var logging = document.getElementById('logging');

     function loggingMessage(message) {
         logging.innerHTML = message;
     }
 }

 ///

 function addSafeMonitor() {
     var videoElement = document.getElementById('trailer');
     var polygon = viewer.entities.add({
         type: 'safeMonitor',
         wall: {
             positions: Cesium.Cartesian3.fromDegreesArrayHeights([119.47767732626868, 35.43605872554983, 100, 119.47803806007047, 35.436058438783725, 100]),
             maximumHeights: [90, 90],
             minimumHeights: [70, 70],
             material: videoElement,
             height: 70,
             extrudedHeight: 90,

         }
     });
 }