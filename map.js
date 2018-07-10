class Map {
	constructor(year, warData) {
		this.year = year;
		this.origin = "!";
		this.lastClicked = true;
		this.map = L.map('map');
		if (L.Browser.mobile) {
		  this.map.setView([15, -21.95], 2);
		} else {
		  this.map.setView([0, 0], 2);
		}
		this.origin_clicked = undefined;
		this.warData = warData;
		this.flowmap = undefined;
		this.chord = undefined;
		this.legend= L.control({position: 'bottomright'});
		this.legend.onAdd = function (map) {
			this.div = L.DomUtil.create('div', 'info legend');
			this.labels =['Origin','Asylum'];

			this.div.innerHTML +=
					'<i style="background:' + 'rgb(195, 255, 62)' + '"></i> ' +
					'<strong>'+this.labels[0]+'</strong>' + '<br>';
			this.div.innerHTML +=
					'<i style="background:' + 'rgb(17, 142, 170)' + '"></i> ' +
					'<strong>'+this.labels[1]+'</strong>' + '<br>';

			return this.div;
		};
		this.setYear(this.year);
	}
	
	setYear(year) {
		this.year = year;
		this.origin = "!";
		var m = this;
		m.map.eachLayer(function (layer) {
			m.map.removeLayer(layer);
		});
		m.map.removeControl(m.legend);
		m.legend.addTo(m.map);
		L.esri.basemapLayer('Topographic').addTo(m.map);
		Papa.parse('datasets/regions_dataset.csv', {
		  download: true,
		  header: true,
		  dynamicTyping: true,
		  skipEmptyLines: true,
		  complete: function(results) {
			var geoJsonFeatureCollection = {
			  type: 'FeatureCollection',
			  features: results.data.filter(function(datum){
				return datum["Year"] == m.year;
			  }).map(function(datum) {
				return {
				  type: 'Feature',
				  geometry: {
					type: 'Point',
					coordinates: [datum["origin longitude"], datum["origin latitude"]]
				  },
				  properties: datum
				}
			  })
			};
			m.flowmap = L.canvasFlowmapLayer(geoJsonFeatureCollection, {
			  originAndDestinationFieldIds: {
				originUniqueIdField: 'origin abbreviation',
				originGeometry: {
				  x: 'origin longitude',
				  y: 'origin latitude'
				},
				destinationUniqueIdField: 'asylum abbreviation',
				destinationGeometry: {
				  x: 'asylum longitude',
				  y: 'asylum latitude'
				}
			  },
			  pathDisplayMode: 'selection',
			  animationStarted: true,
			  animationEasingFamily: 'Cubic',
			  animationEasingType: 'In',
			  animationDuration: 2000
			}).addTo(m.map);
			// since this demo is using the optional "pathDisplayMode" as "selection",
			// it is up to the developer to wire up a click or mouseover listener
			// and then call the "selectFeaturesForPathDisplay()" method to inform the layer
			// which Bezier paths need to be drawn
			var layerPopup;
			m.flowmap.on('click', function(e) {
				if(m.lastClicked==false){
					m.chord.resetChord();
				}
				
				m.origin = e.sharedOriginFeatures[0].properties['origin abbreviation'];

				m.lastClicked = true;

				var selection_mode = 'SELECTION_NEW';
				if(m.origin_clicked == e.sharedOriginFeatures[0].properties['origin abbreviation']){
					var selection_mode = 'SELECTION_SUBTRACT';
					m.origin_clicked = undefined;
				}else{
					m.origin_clicked = e.sharedOriginFeatures[0].properties['origin abbreviation'];
				}
			  	if (e.sharedOriginFeatures.length) {
					m.flowmap.selectFeaturesForPathDisplay(e.sharedOriginFeatures, selection_mode);
				}
			  /*if (e.sharedDestinationFeatures.length) {
				this.flowmap.selectFeaturesForPathDisplay(e.sharedDestinationFeatures, 'SELECTION_NEW');
			  }*/
			}).on('mouseover', function(e) {
				if(m.map) {
					var reason = "No information";
					if(m.warData[m.year][e.sharedOriginFeatures[0].properties['origin abbreviation']]!=undefined) {
						reason = "";
						m.warData[m.year][e.sharedOriginFeatures[0].properties['origin abbreviation']].forEach(function (c) {
							reason += c;
							reason += " | ";
						});
					}
					layerPopup = L.popup().setLatLng([e.sharedOriginFeatures[0].geometry.coordinates[1],e.sharedOriginFeatures[0].geometry.coordinates[0]]).setContent(reason).openOn(m.map);
				}
			}).on('mouseout', function(e) {
				if(layerPopup&&m.map) {
					m.map.closePopup(layerPopup);
					layerPopup = null;
				}
			});
			// immediately select an origin point for Bezier path display,
			// instead of waiting for the first user click event to fire
			//this.flowmap.selectFeaturesForPathDisplayById('origin abbreviation', 'US', true, 'SELECTION_NEW');
		  }
		});
	}

	clearMap(){
		this.flowmap.clearAllPathSelections();
	}

	setChord(chord){
		this.chord = chord;
	}
}

