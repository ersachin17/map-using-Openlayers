'use client'
import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Draw, Modify, Snap } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { fromExtent } from 'ol/geom/Polygon';
import { getArea, getLength } from 'ol/sphere';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [measurement, setMeasurement] = useState<string>('');

  useEffect(() => {
    if (!mapRef.current) return;

    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    const vectorLayer = new VectorLayer({
      source: new VectorSource(), // Initialize with an empty source
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
          stroke: new Stroke({
            color: '#fff',
            width: 2,
          }),
        }),
      }),
    });

    const mapInstance = new Map({
      layers: [baseLayer, vectorLayer],
      target: mapRef.current,
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    const draw = new Draw({
      source: vectorLayer.getSource() as VectorSource, // Assert non-null type
      type: 'Polygon', // Allow drawing polygons
    });

    mapInstance.addInteraction(draw);

    const modify = new Modify({
      source: vectorLayer.getSource() as VectorSource, // Assert non-null type
    });
    mapInstance.addInteraction(modify);

    const snap = new Snap({
      source: vectorLayer.getSource() as VectorSource, // Assert non-null type
    });
    mapInstance.addInteraction(snap);

    // Event listener for drawing end
    draw.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();
        let measurementValue = '';
      
        if (geometry) { // Add null check
          if (geometry.getType() === 'Polygon') {
            const area = getArea(fromExtent(geometry.getExtent()), {
              projection: mapInstance.getView().getProjection(),
              radius: 6378137, // Earth's radius in meters (for EPSG:3857 projection)
            });
            measurementValue = `Area: ${area}`;
          } else if (geometry.getType() === 'LineString') {
            const length = getLength(geometry, {
              projection: mapInstance.getView().getProjection(),
              radius: 6378137, // Earth's radius in meters (for EPSG:3857 projection)
            });
            measurementValue = `Length: ${length}`;
          }
        } else {
          measurementValue = 'Invalid geometry'; // Handle undefined geometry
        }
      
        setMeasurement(measurementValue);
      });
      

    setMap(mapInstance);

    return () => {
      mapInstance.dispose();
    };
  }, []);

  return (
    <div>
      <div ref={mapRef} className="map-container" style={{ width: '100%', height: '500px' }} />
      <div>{measurement}</div>
    </div>
  );
};

export default MapComponent;
