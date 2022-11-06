import "./style.css";
import { Map, View, Feature } from "ol";
import { Vector } from "ol/layer";
import { Circle as CircleStyle, Stroke, Style } from "ol/style";
import { Vector as VectorSource } from "ol/source";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import { OSM, XYZ } from "ol/source";
import { getVectorContext } from "ol/render";
import { easeOut, inAndOut } from 'ol/easing';
import { unByKey } from 'ol/Observable';

const flipLocation = ([l1, l2]) => [l2, l1];

const DOG_FEATURE_ID = "DOG";
const USER_FEATURE_ID = "USER";
const DOG_STANDARD_LOCATION = [51.429244, -0.371133];

const markers = {
  USER_FEATURE_ID: null,
  DOG_FEATURE_ID: null
}

const updateMarker = id => {
  let feature = source.getFeatureById(id);
  const location = markers[id];

  if (location != null) {
    const coordinate = fromLonLat(flipLocation(location));
    if (feature == null) {
      const point = new Point(coordinate);

      feature = new Feature(point);
      feature.setId(id);

      source.addFeature(feature);
    } else {
      feature.getGeometry().setCoordinates(coordinate);
    }

    return;
  }

  if (feature != null) {
    source.removeFeature(feature);
  }
}

const source = new VectorSource({
  features: []
});

const tileLayer = new TileLayer({
  preload: Infinity,
  source: new XYZ({
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=xan8RFPbpLMv96UA9ksr'
  })
});

const pointsLayer = new Vector({
  source: source
});

const map = new Map({
  target: 'map',
  layers: [tileLayer, pointsLayer],
  view: new View({
    center: fromLonLat(flipLocation(DOG_STANDARD_LOCATION)),
    zoom: 12
  })
});

setInterval(() => {
  markers[DOG_FEATURE_ID] = DOG_STANDARD_LOCATION;
  updateMarker(DOG_FEATURE_ID);
}, 1000);

setInterval(() => {
  if (!navigator.geolocation) {
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const location = position.coords;
    markers[USER_FEATURE_ID] = [location.latitude, location.longitude];
    updateMarker(USER_FEATURE_ID);
  });
}, 1000);

const duration = 3000;
function flash(feature) {
  const start = Date.now();
  const flashGeom = feature.getGeometry().clone();
  const listenerKey = tileLayer.on('postrender', animate);

  function animate(event) {
    const frameState = event.frameState;
    const elapsed = frameState.time - start;
    if (elapsed >= duration) {
      unByKey(listenerKey);
      return;
    }
    const vectorContext = getVectorContext(event);
    const elapsedRatio = elapsed / duration;
    // radius will be 5 at start and 30 at end.
    const radius = easeOut(elapsedRatio) * 25 + 5;
    const opacity = easeOut(1 - elapsedRatio);

    const style = new Style({
      image: new CircleStyle({
        radius: radius,
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, ' + opacity + ')',
          width: 0.25 + opacity,
        }),
      }),
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
    // tell OpenLayers to continue postrender animation
    map.render();
  }
}

setInterval(() => {
  source.getFeatures().forEach(flash);
}, 3000);

setInterval(() => {
  

  map.getView().animate({
    zoom: 16,
    center: fromLonLat(flipLocation(DOG_STANDARD_LOCATION)),
    duration: 5000,
    easing: inAndOut,
    rotation: 0
  });

  
}, 10000);